import { boolean, customType, date, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "@/modules/users/schema";

/** bytea — isi file (QRIS, bukti bayar) disimpan di DB supaya tidak butuh volume upload. */
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

export const billingCycle = pgEnum("billing_cycle", ["once", "monthly", "yearly"]);
export const orderStatus = pgEnum("order_status", ["pending", "active", "completed", "cancelled"]);
export const invoiceStatus = pgEnum("invoice_status", ["unpaid", "pending_verification", "paid", "cancelled"]);

export type BillingCycle = (typeof billingCycle.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatus.enumValues)[number];

/** Katalog jasa: konsultasi, pembuatan aplikasi, sewa (server/aplikasi), maintenance. */
/** Satu baris rincian tagihan / rincian biaya langganan, mis. { description: "Sewa Server", amount: 2000000 }. */
export type InvoiceItem = { description: string; amount: number };

/** Satu baris tabel harga bertingkat, mis. { label: "≤ 5.000 pengguna", price: 2500000 }. */
export type PriceTier = { label: string; price: number };

export const servicePackages = pgTable("service_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  category: varchar("category", { length: 64 }).default("Jasa").notNull(),
  description: text("description").default("").notNull(),
  /** Poin fitur yang tampil di kartu paket. */
  features: jsonb("features").$type<string[]>().default([]).notNull(),
  /** Rupiah, bulat. 0 = "hubungi kami". */
  price: integer("price").default(0).notNull(),
  /** Harga bertingkat (mis. per jumlah pengguna). Kosong = pakai `price`. price 0 pada tier = "hubungi". */
  priceTiers: jsonb("price_tiers").$type<PriceTier[]>().default([]).notNull(),
  billingCycle: billingCycle("billing_cycle").default("once").notNull(),
  /** Teks satuan untuk sewa, mis. "bulan", "unit". */
  unit: varchar("unit", { length: 32 }).default("").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Data tambahan akun pelanggan (users + role `customer`). */
export const customerProfiles = pgTable("customer_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  phone: varchar("phone", { length: 64 }).default("").notNull(),
  company: varchar("company", { length: 128 }).default("").notNull(),
  address: text("address").default("").notNull(),
  /** Catatan internal admin. */
  notes: text("notes").default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: varchar("number", { length: 32 }).notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    packageId: uuid("package_id").references(() => servicePackages.id, { onDelete: "set null" }),
    /** Snapshot nama paket saat order (paket bisa berubah/dihapus). */
    packageName: varchar("package_name", { length: 128 }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    /** Brief kebutuhan dari pelanggan. */
    notes: text("notes").default("").notNull(),
    /** Tujuan tagihan (nama pihak yang ditagih); kosong = nama akun/perusahaan. Satu akun bisa punya banyak tujuan. */
    billTo: varchar("bill_to", { length: 160 }).default("").notNull(),
    adminNote: text("admin_note").default("").notNull(),
    status: orderStatus("status").default("pending").notNull(),
    startDate: date("start_date", { mode: "string" }),
    /** Akhir masa berlaku / sudah dibayar sampai (sewa tahunan, kontrak). */
    endDate: date("end_date", { mode: "string" }),
    /** Harga per unit khusus order ini (kesepakatan); null = harga paket. */
    unitPrice: integer("unit_price"),
    /** Objek yang dicakup langganan, mis. daftar domain/subdomain. */
    items: jsonb("items").$type<string[]>().default([]).notNull(),
    /** Sebutan item: "domain", "subdomain", "nomor", … */
    itemLabel: varchar("item_label", { length: 32 }).default("").notNull(),
    /** Batas jumlah item (kuota); null = tanpa batas. */
    itemLimit: integer("item_limit"),
    /** Rincian biaya per siklus (mis. Sewa Server 2 jt + Maintenance 2,5 jt). Kosong = harga unit × jumlah. Dipakai sebagai baris tagihan. */
    breakdown: jsonb("breakdown").$type<InvoiceItem[]>().default([]).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("orders_user_idx").on(t.userId, t.createdAt), index("orders_status_idx").on(t.status)],
);

/** File biner kecil (≤ 3 MB): QRIS admin, bukti pembayaran pelanggan. */
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  mime: varchar("mime", { length: 128 }).notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  /** Boleh diakses tanpa login (QRIS). Bukti bayar = false (hanya pemilik & admin). */
  isPublic: boolean("is_public").default(false).notNull(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: varchar("number", { length: 32 }).notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    title: varchar("title", { length: 255 }).notNull(),
    /** Tujuan tagihan ("Kepada"); kosong = nama akun/perusahaan. */
    billTo: varchar("bill_to", { length: 160 }).default("").notNull(),
    /** Periode tagihan "YYYY-MM" (kosong untuk tagihan sekali). */
    period: varchar("period", { length: 7 }).default("").notNull(),
    amount: integer("amount").notNull(),
    /** Rincian baris tagihan; jumlahnya = amount. Kosong = satu baris (title). */
    items: jsonb("items").$type<InvoiceItem[]>().default([]).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: invoiceStatus("status").default("unpaid").notNull(),
    note: text("note").default("").notNull(),
    proofFileId: uuid("proof_file_id").references(() => files.id, { onDelete: "set null" }),
    proofUploadedAt: timestamp("proof_uploaded_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("invoices_user_idx").on(t.userId, t.status), index("invoices_period_idx").on(t.orderId, t.period)],
);

/** Singleton (id=1): cara bayar yang tampil ke pelanggan. */
export const paymentSettings = pgTable("payment_settings", {
  id: integer("id").primaryKey().default(1),
  qrisFileId: uuid("qris_file_id").references(() => files.id, { onDelete: "set null" }),
  bankName: varchar("bank_name", { length: 64 }).default("").notNull(),
  bankAccount: varchar("bank_account", { length: 64 }).default("").notNull(),
  bankHolder: varchar("bank_holder", { length: 128 }).default("").notNull(),
  instructions: text("instructions").default("").notNull(),
  /** Nomor WA untuk konfirmasi pembayaran (default: profil). */
  confirmPhone: varchar("confirm_phone", { length: 64 }).default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
