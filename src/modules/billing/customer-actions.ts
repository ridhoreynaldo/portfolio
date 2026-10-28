"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db";
import { action, setFlash } from "@/shared/action";
import { AppError, notFound } from "@/shared/errors";
import { requireLogin } from "@/modules/auth/guards";
import { users } from "@/modules/users/schema";
import { PROOF_MIMES, readUpload } from "./files";
import { deleteOrphanFile, getInvoice, getPackageBySlug, insertFile, insertOrder, nextNumber, updateInvoice, upsertCustomerProfile } from "./repository";

/** Pelanggan memesan paket dari /medan/order/<slug>. */
export const placeOrderAction = action(async (form: FormData) => {
  const me = await requireLogin();
  const d = z
    .object({ slug: z.string().trim().min(1).max(128), quantity: z.coerce.number().int().min(1).max(100).default(1), notes: z.string().trim().max(3000).default("") })
    .parse({ slug: form.get("slug"), quantity: form.get("quantity") || 1, notes: form.get("notes") ?? "" });
  const pkg = await getPackageBySlug(d.slug);
  if (!pkg) throw notFound("Paket tidak tersedia");
  const qty = pkg.unit ? d.quantity : 1;
  let number = "";
  for (let i = 0; i < 3; i++) {
    number = await nextNumber("ORD");
    try {
      await insertOrder({ number, userId: me.id, packageId: pkg.id, packageName: pkg.name, quantity: qty, notes: d.notes });
      break;
    } catch (e) {
      if (i === 2 || !String(e).includes("orders_number_unique")) throw e;
    }
  }
  revalidatePath("/medan/dashboard");
  revalidatePath("/admin/orders");
  await setFlash(`Pesanan ${number} diterima. Kami akan menghubungi Anda untuk konfirmasi.`);
  redirect("/medan/dashboard");
});

/** Pelanggan mengunggah bukti pembayaran → status "menunggu verifikasi". */
export const uploadProofAction = action(async (form: FormData) => {
  const me = await requireLogin();
  const id = z.string().uuid().parse(form.get("invoiceId"));
  const inv = await getInvoice(id);
  if (!inv || inv.userId !== me.id) throw notFound("Tagihan tidak ditemukan");
  if (inv.status === "paid" || inv.status === "cancelled") throw new AppError("Tagihan ini sudah selesai");
  const upload = await readUpload(form, "proof", PROOF_MIMES, "Bukti pembayaran");
  if (!upload) throw new AppError("Pilih file bukti pembayaran (JPG/PNG/WebP/PDF)");
  const fileId = await insertFile({ ...upload, isPublic: false, ownerId: me.id });
  const old = inv.proofFileId;
  await updateInvoice(id, { proofFileId: fileId, proofUploadedAt: new Date(), status: "pending_verification" });
  await deleteOrphanFile(old);
  revalidatePath("/medan/dashboard");
  revalidatePath(`/medan/dashboard/tagihan/${id}`);
  revalidatePath("/admin/invoices");
  await setFlash("Bukti pembayaran terkirim. Admin akan memverifikasi.");
  redirect(`/medan/dashboard/tagihan/${id}`);
});

/** Pelanggan mengubah data akunnya sendiri (nama, telepon, perusahaan, alamat). */
export const updateMyProfileAction = action(async (form: FormData) => {
  const me = await requireLogin();
  const d = z
    .object({
      name: z.string().trim().min(2).max(80),
      phone: z.string().trim().max(64).default(""),
      company: z.string().trim().max(128).default(""),
      address: z.string().trim().max(1000).default(""),
    })
    .parse({ name: form.get("name"), phone: form.get("phone") ?? "", company: form.get("company") ?? "", address: form.get("address") ?? "" });
  await db().update(users).set({ name: d.name, updatedAt: new Date() }).where(eq(users.id, me.id));
  await upsertCustomerProfile(me.id, { phone: d.phone, company: d.company, address: d.address });
  revalidatePath("/medan/dashboard/akun");
  await setFlash("Data akun tersimpan");
  redirect("/medan/dashboard/akun");
});
