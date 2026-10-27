"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { action, setFlash } from "@/shared/action";
import { AppError, notFound } from "@/shared/errors";
import { requirePermission } from "@/modules/auth/guards";
import { hashPassword } from "@/modules/auth/password";
import { revokeUserSessions } from "@/modules/auth/session";
import { slugify } from "@/modules/content/repository";
import { revalidatePortfolio } from "@/modules/portfolio/service";
import { findUserByEmail, getUser, saveUser } from "@/modules/users/repository";
import { IMAGE_MIMES, readUpload } from "./files";
import { PACKAGE_CATEGORIES } from "./labels";
import {
  customerRoleId, deleteInvoice, deleteOrder, deleteOrphanFile, deletePackage, getInvoice, getOrder, getPackage, getPaymentSettings, insertFile, insertInvoice,
  insertOrder, insertPackage, invoiceLinesFor, monthlyOrdersWithoutInvoice, nextNumber, orderTotal, uniquePackageSlug, updateInvoice, updateOrder, updatePackage, upsertCustomerProfile, upsertPaymentSettings,
} from "./repository";
import { billingCycle, invoiceStatus, orderStatus } from "./schema";

const uuid = z.string().uuid();
const money = z.coerce.number().int().min(0).max(1_000_000_000);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const lines = (s: unknown) =>
  String(s ?? "")
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);

/** Textarea rincian: satu baris "deskripsi | nominal" → baris tagihan / rincian biaya. */
const lineItems = (s: unknown) =>
  lines(s)
    .map((row) => {
      const [description = "", raw = ""] = row.split("|").map((x) => x.trim());
      return { description: description.slice(0, 160), amount: Math.max(0, Math.min(1_000_000_000, Math.round(Number(raw.replace(/[^\d]/g, "")) || 0))) };
    })
    .filter((t) => t.description);

/** Textarea harga bertingkat: satu baris "label | harga" (harga kosong/0 = "hubungi"). */
const tiers = (s: unknown) =>
  lines(s).map((row) => {
    const [label = "", raw = ""] = row.split("|").map((x) => x.trim());
    return { label: label.slice(0, 64), price: Math.max(0, Math.min(1_000_000_000, Math.round(Number(raw.replace(/[^\d]/g, "")) || 0))) };
  }).filter((t) => t.label);

// ── Paket layanan ─────────────────────────────────────────────────────────────
const packageInput = z.object({
  name: z.string().trim().min(2).max(128),
  slug: z.string().trim().max(128).default(""),
  category: z.enum(PACKAGE_CATEGORIES),
  description: z.string().trim().max(2000).default(""),
  price: money,
  billingCycle: z.enum(billingCycle.enumValues),
  unit: z.string().trim().max(32).default(""),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const savePackageAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`package.${id ? "update" : "create"}`);
  const d = packageInput.parse({
    name: form.get("name"), slug: form.get("slug") ?? "", category: form.get("category"), description: form.get("description") ?? "",
    price: form.get("price") || 0, billingCycle: form.get("billingCycle"), unit: form.get("unit") ?? "",
    isActive: form.get("isActive") === "on", isFeatured: form.get("isFeatured") === "on", sortOrder: form.get("sortOrder") || 0,
  });
  if (id && !(await getPackage(id))) throw notFound();
  const slug = await uniquePackageSlug(slugify(d.slug || d.name), id);
  const values = { ...d, slug, features: lines(form.get("features")), priceTiers: tiers(form.get("priceTiers")) };
  if (id) await updatePackage(id, values);
  else await insertPackage(values);
  revalidatePath("/admin/packages");
  revalidatePath("/jasa");
  revalidatePortfolio();
  await setFlash(`Paket "${d.name}" tersimpan`);
  redirect("/admin/packages");
});

export const deletePackageAction = action(async (form: FormData) => {
  await requirePermission("package.delete");
  const id = uuid.parse(form.get("id"));
  const p = await getPackage(id);
  if (!p) throw notFound();
  await deletePackage(id);
  revalidatePath("/admin/packages");
  revalidatePath("/jasa");
  revalidatePortfolio();
  await setFlash(`Paket "${p.name}" dihapus`);
});

// ── Order ─────────────────────────────────────────────────────────────────────
/** Field langganan yang diisi admin (dipakai form proses & order manual). */
const subscriptionInput = z.object({
  status: z.enum(orderStatus.enumValues),
  adminNote: z.string().trim().max(2000).default(""),
  startDate: z.string().trim().default(""),
  endDate: z.string().trim().default(""),
  unitPrice: z.union([z.literal(""), money]).transform((v) => (v === "" ? null : v)),
  itemLabel: z.string().trim().max(32).default(""),
  itemLimit: z.union([z.literal(""), z.coerce.number().int().min(0).max(100000)]).transform((v) => (v === "" || v === 0 ? null : v)),
});
const readSubscription = (form: FormData) => {
  const d = subscriptionInput.parse({
    status: form.get("status"), adminNote: form.get("adminNote") ?? "", startDate: form.get("startDate") ?? "", endDate: form.get("endDate") ?? "",
    unitPrice: String(form.get("unitPrice") ?? "").trim(), itemLabel: form.get("itemLabel") ?? "", itemLimit: String(form.get("itemLimit") ?? "").trim(),
  });
  if (d.startDate && !DATE.test(d.startDate)) throw new AppError("Tanggal mulai tidak valid");
  if (d.endDate && !DATE.test(d.endDate)) throw new AppError("Tanggal berakhir tidak valid");
  const items = String(form.get("items") ?? "").split(/[\r\n,]+/).map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 200);
  if (d.itemLimit != null && items.length > d.itemLimit) throw new AppError(`Jumlah ${d.itemLabel || "item"} (${items.length}) melebihi limit ${d.itemLimit}`);
  const breakdown = lineItems(form.get("breakdown"));
  return { status: d.status, adminNote: d.adminNote, startDate: d.startDate || null, endDate: d.endDate || null, unitPrice: d.unitPrice, itemLabel: d.itemLabel, itemLimit: d.itemLimit, items, breakdown };
};

export const updateOrderAction = action(async (form: FormData) => {
  await requirePermission("order.update");
  const id = uuid.parse(form.get("id"));
  const v = readSubscription(form);
  const o = await getOrder(id);
  if (!o) throw notFound();
  await updateOrder(id, v);
  revalidatePath("/admin/orders");
  revalidatePath("/portal");
  revalidatePath("/portal/orders");
  await setFlash(`Order ${o.number} diperbarui`);
  redirect("/admin/orders");
});

/** Admin membuat order/langganan langsung untuk pelanggan (tanpa lewat form portal). */
export const createOrderAction = action(async (form: FormData) => {
  await requirePermission("order.create");
  const d = z
    .object({ userId: uuid, packageId: uuid, quantity: z.coerce.number().int().min(1).max(100).default(1) })
    .parse({ userId: form.get("userId"), packageId: form.get("packageId"), quantity: form.get("quantity") || 1 });
  const v = readSubscription(form);
  const [cust, pkg] = await Promise.all([getUser(d.userId), getPackage(d.packageId)]);
  if (!cust) throw new AppError("Pelanggan tidak ditemukan");
  if (!pkg) throw new AppError("Paket tidak ditemukan");
  let number = "";
  for (let i = 0; i < 3; i++) {
    number = await nextNumber("ORD");
    try {
      await insertOrder({ number, userId: d.userId, packageId: pkg.id, packageName: pkg.name, quantity: d.quantity, notes: "", ...v });
      break;
    } catch (e) {
      if (i === 2 || !String(e).includes("orders_number_unique")) throw e;
    }
  }
  revalidatePath("/admin/orders");
  revalidatePath("/portal");
  revalidatePath("/portal/orders");
  await setFlash(`Order ${number} dibuat untuk ${cust.name}`);
  redirect("/admin/orders");
});

export const deleteOrderAction = action(async (form: FormData) => {
  await requirePermission("order.delete");
  const id = uuid.parse(form.get("id"));
  const o = await getOrder(id);
  if (!o) throw notFound();
  await deleteOrder(id);
  revalidatePath("/admin/orders");
  await setFlash(`Order ${o.number} dihapus`);
});

// ── Tagihan ───────────────────────────────────────────────────────────────────
const invoiceInput = z.object({
  userId: uuid,
  orderId: z.union([z.literal(""), uuid]).transform((v) => v || null),
  title: z.string().trim().min(2).max(255),
  period: z.string().trim().default(""),
  amount: money,
  dueDate: z.string().regex(DATE, "Jatuh tempo tidak valid"),
  note: z.string().trim().max(2000).default(""),
  paidAt: z.string().trim().default(""),
});

export const saveInvoiceAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`invoice.${id ? "update" : "create"}`);
  const { paidAt, ...d } = invoiceInput.parse({
    userId: form.get("userId"), orderId: form.get("orderId") ?? "", title: form.get("title"), period: form.get("period") ?? "",
    amount: form.get("amount") || 0, dueDate: form.get("dueDate"), note: form.get("note") ?? "", paidAt: form.get("paidAt") ?? "",
  });
  if (d.period && !PERIOD.test(d.period)) throw new AppError("Periode harus format YYYY-MM");
  if (paidAt && !DATE.test(paidAt)) throw new AppError("Tanggal bayar tidak valid");
  const items = lineItems(form.get("items"));
  if (items.length) d.amount = items.reduce((t, i) => t + i.amount, 0); // nominal = jumlah rincian
  if (d.amount < 1) throw new AppError("Nominal minimal 1 (isi nominal atau rincian)");
  if (!(await getUser(d.userId))) throw new AppError("Pelanggan tidak ditemukan");
  if (d.orderId) {
    const o = await getOrder(d.orderId);
    if (!o || o.userId !== d.userId) throw new AppError("Order tidak cocok dengan pelanggan");
  }
  const paidPatch = paidAt ? { status: "paid" as const, paidAt: new Date(`${paidAt}T12:00:00+07:00`) } : {};
  if (id) {
    const inv = await getInvoice(id);
    if (!inv) throw notFound();
    await updateInvoice(id, { ...d, items, ...paidPatch });
    await setFlash(`Tagihan ${inv.number} diperbarui`);
  } else {
    const number = await createWithNumber({ ...d, items, ...paidPatch });
    await setFlash(`Tagihan ${number} dibuat`);
  }
  revalidatePath("/admin/invoices");
  revalidatePath("/portal");
  redirect("/admin/invoices");
});

/** Insert dengan nomor urut; ulang bila nomor bentrok (dua admin bersamaan). */
async function createWithNumber(v: Omit<typeof import("./schema").invoices.$inferInsert, "number">) {
  for (let i = 0; i < 3; i++) {
    const number = await nextNumber("INV");
    try {
      await insertInvoice({ ...v, number });
      return number;
    } catch (e) {
      if (i === 2 || !String(e).includes("invoices_number_unique")) throw e;
    }
  }
  throw new AppError("Gagal membuat nomor tagihan");
}

export const setInvoiceStatusAction = action(async (form: FormData) => {
  await requirePermission("invoice.update");
  const d = z.object({ id: uuid, status: z.enum(invoiceStatus.enumValues) }).parse({ id: form.get("id"), status: form.get("status") });
  const inv = await getInvoice(d.id);
  if (!inv) throw notFound();
  await updateInvoice(d.id, { status: d.status, paidAt: d.status === "paid" ? (inv.paidAt ?? new Date()) : null });
  revalidatePath("/admin/invoices");
  revalidatePath("/portal");
  await setFlash(`Tagihan ${inv.number}: ${d.status === "paid" ? "ditandai lunas" : d.status === "cancelled" ? "dibatalkan" : "status diubah"}`);
});

export const deleteInvoiceAction = action(async (form: FormData) => {
  await requirePermission("invoice.delete");
  const id = uuid.parse(form.get("id"));
  const inv = await getInvoice(id);
  if (!inv) throw notFound();
  await deleteInvoice(id);
  await deleteOrphanFile(inv.proofFileId);
  revalidatePath("/admin/invoices");
  await setFlash(`Tagihan ${inv.number} dihapus`);
});

/** Buat tagihan bulanan untuk semua order aktif berpaket bulanan yang belum ditagih di periode ini. */
export const generateMonthlyInvoicesAction = action(async (form: FormData) => {
  await requirePermission("invoice.create");
  const d = z
    .object({ period: z.string().regex(PERIOD, "Periode harus YYYY-MM"), dueDay: z.coerce.number().int().min(1).max(28).default(10) })
    .parse({ period: form.get("period"), dueDay: form.get("dueDay") || 10 });
  const candidates = await monthlyOrdersWithoutInvoice(d.period);
  const dueDate = `${d.period}-${String(d.dueDay).padStart(2, "0")}`;
  let n = 0;
  for (const o of candidates) {
    const price = orderTotal(o);
    if (price <= 0) continue; // paket "hubungi kami" tanpa harga kesepakatan tidak ditagih otomatis
    await createWithNumber({
      userId: o.userId, orderId: o.id, title: `${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""} — ${o.number}`, period: d.period,
      amount: price, items: invoiceLinesFor(o), dueDate, note: "Tagihan bulanan otomatis",
    });
    n++;
  }
  revalidatePath("/admin/invoices");
  revalidatePath("/portal");
  await setFlash(n ? `${n} tagihan periode ${d.period} dibuat` : `Tidak ada order aktif yang perlu ditagih untuk ${d.period}`, n ? "ok" : "error");
  redirect("/admin/invoices");
});

// ── Pengaturan pembayaran ─────────────────────────────────────────────────────
export const savePaymentSettingsAction = action(async (form: FormData) => {
  const me = await requirePermission("payment.update");
  const d = z
    .object({
      bankName: z.string().trim().max(64).default(""),
      bankAccount: z.string().trim().max(64).default(""),
      bankHolder: z.string().trim().max(128).default(""),
      confirmPhone: z.string().trim().max(64).default(""),
      instructions: z.string().trim().max(4000).default(""),
      removeQris: z.boolean(),
    })
    .parse({
      bankName: form.get("bankName") ?? "", bankAccount: form.get("bankAccount") ?? "", bankHolder: form.get("bankHolder") ?? "",
      confirmPhone: form.get("confirmPhone") ?? "", instructions: form.get("instructions") ?? "", removeQris: form.get("removeQris") === "on",
    });
  const current = await getPaymentSettings();
  const upload = await readUpload(form, "qris", IMAGE_MIMES, "Gambar QRIS");
  let qrisFileId = current?.qrisFileId ?? null;
  if (upload) qrisFileId = await insertFile({ ...upload, isPublic: true, ownerId: me.id });
  else if (d.removeQris) qrisFileId = null;
  const { removeQris: _r, ...rest } = d;
  await upsertPaymentSettings({ ...rest, qrisFileId });
  if (current?.qrisFileId && current.qrisFileId !== qrisFileId) await deleteOrphanFile(current.qrisFileId);
  revalidatePath("/admin/payment");
  revalidatePath("/portal");
  await setFlash("Pengaturan pembayaran tersimpan");
  redirect("/admin/payment");
});

// ── Pelanggan (akun + profil) ─────────────────────────────────────────────────
const customerInput = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((s) => s.toLowerCase()),
  password: z.string().max(128).default(""),
  phone: z.string().trim().max(64).default(""),
  company: z.string().trim().max(128).default(""),
  address: z.string().trim().max(1000).default(""),
  notes: z.string().trim().max(2000).default(""),
  isActive: z.boolean(),
});

export const saveCustomerAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`customer.${id ? "update" : "create"}`);
  const d = customerInput.parse({
    id, name: form.get("name"), email: form.get("email"), password: form.get("password") ?? "", phone: form.get("phone") ?? "",
    company: form.get("company") ?? "", address: form.get("address") ?? "", notes: form.get("notes") ?? "", isActive: form.get("isActive") === "on",
  });
  if (!id && d.password.length < 8) throw new AppError("Password minimal 8 karakter");
  if (d.password && d.password.length < 8) throw new AppError("Password minimal 8 karakter");
  const roleId = await customerRoleId();
  if (!roleId) throw new AppError("Role customer belum ada — jalankan migrasi");
  const dup = await findUserByEmail(d.email);
  if (dup && dup.id !== id) throw new AppError("Email sudah terdaftar");
  if (id) {
    const u = await getUser(id);
    if (!u) throw notFound();
    // hanya data akun; role tidak disentuh (null) supaya pelanggan yang juga staf tidak kehilangan role
    await saveUser({ id, name: d.name, email: d.email, isActive: d.isActive, passwordHash: d.password ? await hashPassword(d.password) : undefined }, null);
    if (d.password || !d.isActive) await revokeUserSessions(id);
  } else {
    const u = await saveUser({ name: d.name, email: d.email, isActive: d.isActive, passwordHash: await hashPassword(d.password) }, [roleId]);
    await upsertCustomerProfile(u.id, { phone: d.phone, company: d.company, address: d.address, notes: d.notes });
    revalidatePath("/admin/customers");
    await setFlash(`Akun pelanggan ${d.email} dibuat`);
    redirect("/admin/customers");
  }
  await upsertCustomerProfile(id, { phone: d.phone, company: d.company, address: d.address, notes: d.notes });
  revalidatePath("/admin/customers");
  await setFlash(`Pelanggan ${d.email} tersimpan`);
  redirect("/admin/customers");
});
