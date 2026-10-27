import { and, asc, desc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { users, userRoles } from "@/modules/users/schema";
import { roles } from "@/modules/rbac/schema";
import { CUSTOMER_ROLE } from "@/modules/rbac/permissions";
import { customerProfiles, files, invoices, orders, paymentSettings, servicePackages, type InvoiceStatus, type OrderStatus } from "./schema";

// ── Paket layanan ─────────────────────────────────────────────────────────────
export type PackageRow = typeof servicePackages.$inferSelect;

export const listPackages = (activeOnly = false) =>
  db()
    .select()
    .from(servicePackages)
    .where(activeOnly ? eq(servicePackages.isActive, true) : undefined)
    .orderBy(desc(servicePackages.isFeatured), asc(servicePackages.sortOrder), asc(servicePackages.name));

export const getPackage = async (id: string) => (await db().select().from(servicePackages).where(eq(servicePackages.id, id)).limit(1))[0];
export const getPackageBySlug = async (slug: string) =>
  (await db().select().from(servicePackages).where(and(eq(servicePackages.slug, slug), eq(servicePackages.isActive, true))).limit(1))[0];
export const insertPackage = async (v: typeof servicePackages.$inferInsert) => (await db().insert(servicePackages).values(v).returning())[0]!;
export const updatePackage = (id: string, v: Partial<typeof servicePackages.$inferInsert>) =>
  db().update(servicePackages).set({ ...v, updatedAt: new Date() }).where(eq(servicePackages.id, id));
export const deletePackage = (id: string) => db().delete(servicePackages).where(eq(servicePackages.id, id));

export async function uniquePackageSlug(base: string, excludeId?: string) {
  const rows = await db()
    .select({ slug: servicePackages.slug })
    .from(servicePackages)
    .where(excludeId ? sql`${servicePackages.slug} like ${base + "%"} and ${servicePackages.id} <> ${excludeId}` : sql`${servicePackages.slug} like ${base + "%"}`);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

// ── Nomor dokumen ─────────────────────────────────────────────────────────────
/** "INV-202610-0007": urut per bulan. Unik dijamin index; pemanggil mengulang bila bentrok. */
export async function nextNumber(kind: "ORD" | "INV", when = new Date()) {
  const ym = `${when.getFullYear()}${String(when.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `${kind}-${ym}-`;
  const table = kind === "ORD" ? orders : invoices;
  const [row] = await db()
    .select({ n: sql<number>`count(*)::int` })
    .from(table)
    .where(sql`${table.number} like ${prefix + "%"}`);
  return `${prefix}${String((row?.n ?? 0) + 1).padStart(4, "0")}`;
}

// ── Order ─────────────────────────────────────────────────────────────────────
const orderSelect = {
  id: orders.id,
  number: orders.number,
  userId: orders.userId,
  packageId: orders.packageId,
  packageName: orders.packageName,
  quantity: orders.quantity,
  notes: orders.notes,
  adminNote: orders.adminNote,
  status: orders.status,
  startDate: orders.startDate,
  endDate: orders.endDate,
  unitPrice: orders.unitPrice,
  items: orders.items,
  itemLabel: orders.itemLabel,
  itemLimit: orders.itemLimit,
  createdAt: orders.createdAt,
  updatedAt: orders.updatedAt,
  customerName: users.name,
  customerEmail: users.email,
  price: servicePackages.price,
  billingCycle: servicePackages.billingCycle,
  unit: servicePackages.unit,
};
export type OrderRow = { [K in keyof typeof orderSelect]: (typeof orderSelect)[K]["_"]["data"] | (K extends "price" | "billingCycle" | "unit" ? null : never) };

/** Harga per unit yang berlaku: kesepakatan khusus order, kalau tidak ada harga paket. */
export const orderUnitPrice = (o: Pick<OrderRow, "unitPrice" | "price">) => o.unitPrice ?? o.price ?? 0;
/** Total per siklus = harga unit × jumlah. */
export const orderTotal = (o: Pick<OrderRow, "unitPrice" | "price" | "quantity">) => orderUnitPrice(o) * o.quantity;

/** Periode "YYYY-MM" terakhir yang LUNAS per order (untuk "lunas s/d …" di langganan bulanan). */
export async function lastPaidPeriods(userId: string): Promise<Record<string, string>> {
  const rows = await db()
    .select({ orderId: invoices.orderId, period: sql<string>`max(${invoices.period})` })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.status, "paid"), sql`${invoices.orderId} is not null and ${invoices.period} <> ''`))
    .groupBy(invoices.orderId);
  return Object.fromEntries(rows.filter((r) => r.orderId).map((r) => [r.orderId!, r.period]));
}

/** Tagihan terbuka (belum lunas) per order, untuk tombol "bayar" di kartu langganan. */
export async function openInvoiceByOrder(userId: string): Promise<Record<string, { id: string; period: string; amount: number; status: InvoiceStatus }>> {
  const rows = await db()
    .select({ id: invoices.id, orderId: invoices.orderId, period: invoices.period, amount: invoices.amount, status: invoices.status })
    .from(invoices)
    .where(and(eq(invoices.userId, userId), sql`${invoices.status} in ('unpaid','pending_verification') and ${invoices.orderId} is not null`))
    .orderBy(asc(invoices.dueDate));
  const out: Record<string, { id: string; period: string; amount: number; status: InvoiceStatus }> = {};
  for (const r of rows) if (r.orderId && !out[r.orderId]) out[r.orderId] = { id: r.id, period: r.period, amount: r.amount, status: r.status };
  return out;
}

export const listOrders = (filter: { userId?: string; status?: OrderStatus } = {}) =>
  db()
    .select(orderSelect)
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .leftJoin(servicePackages, eq(servicePackages.id, orders.packageId))
    .where(and(filter.userId ? eq(orders.userId, filter.userId) : undefined, filter.status ? eq(orders.status, filter.status) : undefined))
    .orderBy(desc(orders.createdAt)) as Promise<OrderRow[]>;

export const getOrder = async (id: string) =>
  (
    await db()
      .select(orderSelect)
      .from(orders)
      .innerJoin(users, eq(users.id, orders.userId))
      .leftJoin(servicePackages, eq(servicePackages.id, orders.packageId))
      .where(eq(orders.id, id))
      .limit(1)
  )[0] as OrderRow | undefined;

export const insertOrder = async (v: typeof orders.$inferInsert) => (await db().insert(orders).values(v).returning())[0]!;
export const updateOrder = (id: string, v: Partial<typeof orders.$inferInsert>) => db().update(orders).set({ ...v, updatedAt: new Date() }).where(eq(orders.id, id));
export const deleteOrder = (id: string) => db().delete(orders).where(eq(orders.id, id));

// ── Tagihan ───────────────────────────────────────────────────────────────────
const invoiceSelect = {
  id: invoices.id,
  number: invoices.number,
  userId: invoices.userId,
  orderId: invoices.orderId,
  title: invoices.title,
  period: invoices.period,
  amount: invoices.amount,
  dueDate: invoices.dueDate,
  status: invoices.status,
  note: invoices.note,
  proofFileId: invoices.proofFileId,
  proofUploadedAt: invoices.proofUploadedAt,
  paidAt: invoices.paidAt,
  createdAt: invoices.createdAt,
  customerName: users.name,
  customerEmail: users.email,
};
export type InvoiceRow = { [K in keyof typeof invoiceSelect]: (typeof invoiceSelect)[K]["_"]["data"] };

export const listInvoices = (filter: { userId?: string; status?: InvoiceStatus } = {}) =>
  db()
    .select(invoiceSelect)
    .from(invoices)
    .innerJoin(users, eq(users.id, invoices.userId))
    .where(and(filter.userId ? eq(invoices.userId, filter.userId) : undefined, filter.status ? eq(invoices.status, filter.status) : undefined))
    .orderBy(desc(invoices.createdAt)) as Promise<InvoiceRow[]>;

export const getInvoice = async (id: string) =>
  (await db().select(invoiceSelect).from(invoices).innerJoin(users, eq(users.id, invoices.userId)).where(eq(invoices.id, id)).limit(1))[0] as InvoiceRow | undefined;

export const insertInvoice = async (v: typeof invoices.$inferInsert) => (await db().insert(invoices).values(v).returning())[0]!;
export const updateInvoice = (id: string, v: Partial<typeof invoices.$inferInsert>) =>
  db().update(invoices).set({ ...v, updatedAt: new Date() }).where(eq(invoices.id, id));
export const deleteInvoice = (id: string) => db().delete(invoices).where(eq(invoices.id, id));

/** Order aktif berpaket bulanan yang BELUM punya tagihan untuk periode ini. */
export async function monthlyOrdersWithoutInvoice(period: string) {
  const billed = db().select({ id: invoices.orderId }).from(invoices).where(and(eq(invoices.period, period), sql`${invoices.orderId} is not null`));
  return db()
    .select(orderSelect)
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .innerJoin(servicePackages, eq(servicePackages.id, orders.packageId))
    .where(and(eq(orders.status, "active"), eq(servicePackages.billingCycle, "monthly"), notInArray(orders.id, billed)))
    .orderBy(asc(orders.createdAt)) as Promise<OrderRow[]>;
}

// ── File ──────────────────────────────────────────────────────────────────────
export const insertFile = async (v: typeof files.$inferInsert) => (await db().insert(files).values(v).returning({ id: files.id }))[0]!.id;
export const getFile = async (id: string) => (await db().select().from(files).where(eq(files.id, id)).limit(1))[0];
export const getFileMeta = async (id: string) =>
  (await db().select({ id: files.id, name: files.name, mime: files.mime, size: files.size, isPublic: files.isPublic, ownerId: files.ownerId }).from(files).where(eq(files.id, id)).limit(1))[0];
export const deleteFile = (id: string) => db().delete(files).where(eq(files.id, id));

// ── Pengaturan pembayaran (singleton id=1) ────────────────────────────────────
export const getPaymentSettings = async () => (await db().select().from(paymentSettings).where(eq(paymentSettings.id, 1)).limit(1))[0];
export const upsertPaymentSettings = (v: Partial<typeof paymentSettings.$inferInsert>) =>
  db()
    .insert(paymentSettings)
    .values({ id: 1, ...v })
    .onConflictDoUpdate({ target: paymentSettings.id, set: { ...v, updatedAt: new Date() } });

// ── Pelanggan ─────────────────────────────────────────────────────────────────
export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  phone: string;
  company: string;
  address: string;
  notes: string;
  orderCount: number;
  unpaidCount: number;
  unpaidTotal: number;
};

export const customerRoleId = async () => (await db().select({ id: roles.id }).from(roles).where(eq(roles.name, CUSTOMER_ROLE)).limit(1))[0]?.id;

/** Semua user ber-role customer + profil + ringkasan order/tagihan (1 query agregat). */
export async function listCustomers(): Promise<CustomerRow[]> {
  const rows = await db().execute<CustomerRow>(sql`
    select u.id, u.name, u.email, u.is_active as "isActive", u.last_login_at as "lastLoginAt", u.created_at as "createdAt",
           coalesce(cp.phone,'') as phone, coalesce(cp.company,'') as company, coalesce(cp.address,'') as address, coalesce(cp.notes,'') as notes,
           (select count(*) from ${orders} o where o.user_id = u.id)::int as "orderCount",
           (select count(*) from ${invoices} i where i.user_id = u.id and i.status in ('unpaid','pending_verification'))::int as "unpaidCount",
           (select coalesce(sum(amount),0) from ${invoices} i where i.user_id = u.id and i.status in ('unpaid','pending_verification'))::int as "unpaidTotal"
    from ${users} u
    join ${userRoles} ur on ur.user_id = u.id
    join ${roles} r on r.id = ur.role_id and r.name = ${CUSTOMER_ROLE}
    left join ${customerProfiles} cp on cp.user_id = u.id
    order by u.created_at desc`);
  return [...rows];
}

export const getCustomerProfile = async (userId: string) => (await db().select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1))[0];
export const upsertCustomerProfile = (userId: string, v: Partial<typeof customerProfiles.$inferInsert>) =>
  db()
    .insert(customerProfiles)
    .values({ userId, ...v })
    .onConflictDoUpdate({ target: customerProfiles.userId, set: { ...v, updatedAt: new Date() } });

/** Pilihan pelanggan untuk dropdown tagihan. */
export const customerOptions = async () => {
  const rid = await customerRoleId();
  if (!rid) return [];
  return db()
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .innerJoin(userRoles, and(eq(userRoles.userId, users.id), eq(userRoles.roleId, rid)))
    .where(eq(users.isActive, true))
    .orderBy(asc(users.name));
};

/** Ringkasan untuk dashboard admin & portal. */
export async function billingStats(userId?: string) {
  const [r] = await db().execute<{ pendingOrders: number; activeOrders: number; unpaid: number; unpaidTotal: number; verifying: number; paidTotal: number }>(sql`
    select (select count(*) from ${orders} where status = 'pending' ${userId ? sql`and user_id = ${userId}` : sql``})::int as "pendingOrders",
           (select count(*) from ${orders} where status = 'active' ${userId ? sql`and user_id = ${userId}` : sql``})::int as "activeOrders",
           (select count(*) from ${invoices} where status = 'unpaid' ${userId ? sql`and user_id = ${userId}` : sql``})::int as unpaid,
           (select coalesce(sum(amount),0) from ${invoices} where status in ('unpaid','pending_verification') ${userId ? sql`and user_id = ${userId}` : sql``})::int as "unpaidTotal",
           (select count(*) from ${invoices} where status = 'pending_verification' ${userId ? sql`and user_id = ${userId}` : sql``})::int as verifying,
           (select coalesce(sum(amount),0) from ${invoices} where status = 'paid' ${userId ? sql`and user_id = ${userId}` : sql``})::int as "paidTotal"`);
  return r!;
}

/** Hapus file bukti/QRIS yang tidak dirujuk lagi (dipanggil setelah ganti file). */
export const deleteOrphanFile = async (id: string | null | undefined) => {
  if (!id) return;
  const [ref] = await db()
    .select({ n: sql<number>`(select count(*) from ${invoices} where proof_file_id = ${id})::int + (select count(*) from ${paymentSettings} where qris_file_id = ${id})::int` })
    .from(files)
    .where(eq(files.id, id))
    .limit(1);
  if (ref && ref.n === 0) await deleteFile(id);
};

export const ownsInvoice = async (invoiceId: string, userId: string) =>
  !!(await db().select({ id: invoices.id }).from(invoices).where(and(eq(invoices.id, invoiceId), eq(invoices.userId, userId))).limit(1))[0];
