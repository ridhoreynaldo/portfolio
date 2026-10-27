/**
 * Migrasi + seed idempotent. Pakai koneksi LANGSUNG ke Postgres (DATABASE_URL_DIRECT), bukan PgBouncer.
 * Aman dijalankan berulang — di container `migrate` setiap deploy, atau lokal: npm run db:migrate
 *
 * Yang dilakukan setelah migrasi SQL:
 *  1. sinkron tabel permissions dengan rbac/permissions.ts (permission lama `x.manage` dipetakan ke granular)
 *  2. role sistem super_admin (+ role admin default bila belum ada)
 *  3. super admin pertama dari SEED_ADMIN_* bila belum ada user ber-role sistem
 *  4. menu admin (perbaiki path/permission dari versi lama, tambah menu baru) & menu PUBLIC
 *  5. baris profil (id=1) + pengaturan pembayaran (id=1)
 *  6. role `customer` (pelanggan portal) dan konten awal (scripts/seed-content.ts — tidak menimpa data yang ada)
 */
import { and, eq, inArray, isNull, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "@/shared/db/schema";
import { hashPassword } from "@/modules/auth/password";
import { CUSTOMER_ROLE, LEGACY_PERMISSION_MAP, PERMISSIONS, SUPER_ROLE } from "@/modules/rbac/permissions";
import { seedContent } from "./seed-content";

const { users, userRoles, roles, permissions, rolePermissions, menus, profile, paymentSettings } = schema;

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_DIRECT / DATABASE_URL belum diset");
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });
const log = (m: string) => console.log(`[migrate] ${m}`);

// UUID tetap (sama dengan seed versi lama) agar idempotent lintas versi
const R_SUPER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const R_ADMIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const R_CUSTOMER = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const M = (n: string) => `d0000000-0000-0000-0000-0000000000${n}`;

async function syncPermissions() {
  await db
    .insert(permissions)
    .values(PERMISSIONS.map((p) => ({ key: p.key, description: p.description })))
    .onConflictDoUpdate({ target: permissions.key, set: { description: sql`excluded.description` } });

  // Permission lama → granular: role yang punya `x.manage` dapat semua aksi modul itu
  const legacyKeys = Object.keys(LEGACY_PERMISSION_MAP);
  const legacy = await db.select().from(permissions).where(inArray(permissions.key, legacyKeys));
  for (const lp of legacy) {
    const holders = await db.select({ roleId: rolePermissions.roleId }).from(rolePermissions).where(eq(rolePermissions.permissionId, lp.id));
    const targets = await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.key, LEGACY_PERMISSION_MAP[lp.key]!));
    if (holders.length && targets.length) {
      await db
        .insert(rolePermissions)
        .values(holders.flatMap((h) => targets.map((t) => ({ roleId: h.roleId, permissionId: t.id }))))
        .onConflictDoNothing();
    }
    log(`permission lama ${lp.key} → ${LEGACY_PERMISSION_MAP[lp.key]!.length} permission baru (${holders.length} role)`);
  }
  // buang permission yang tidak dikenal kode (termasuk yang lama)
  const del = await db.delete(permissions).where(notInArray(permissions.key, PERMISSIONS.map((p) => p.key))).returning({ key: permissions.key });
  if (del.length) log(`hapus permission usang: ${del.map((d) => d.key).join(", ")}`);
}

async function ensureRoles() {
  await db
    .insert(roles)
    .values({ id: R_SUPER, name: SUPER_ROLE, description: "Akses penuh ke seluruh sistem", isSystem: true })
    .onConflictDoUpdate({ target: roles.name, set: { isSystem: true } });
  const created = await db
    .insert(roles)
    .values({ id: R_ADMIN, name: "admin", description: "Mengelola konten portofolio (tanpa user/role/menu)" })
    .onConflictDoNothing()
    .returning({ id: roles.id });
  if (created.length) {
    const contentPerms = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.key, PERMISSIONS.filter((p) => ["profile", "experience", "certification", "skill", "project"].includes(p.module)).map((p) => p.key)));
    await db.insert(rolePermissions).values(contentPerms.map((p) => ({ roleId: created[0]!.id, permissionId: p.id }))).onConflictDoNothing();
    log("role admin dibuat dengan permission konten");
  }
  // role pelanggan: tanpa permission admin; dipakai /register dan /admin/customers
  const cust = await db
    .insert(roles)
    .values({ id: R_CUSTOMER, name: CUSTOMER_ROLE, description: "Pelanggan portal layanan (order & tagihan) — tanpa akses panel admin" })
    .onConflictDoNothing()
    .returning({ id: roles.id });
  if (cust.length) log("role customer dibuat");
}

async function ensureSuperAdmin() {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(roles.isSystem, true));
  if ((row?.n ?? 0) > 0) return;
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn("[migrate] belum ada super admin dan SEED_ADMIN_EMAIL/PASSWORD tidak diset — tidak ada akun yang bisa login!");
    return;
  }
  const [u] = await db
    .insert(users)
    .values({ email, name: "Super Admin", passwordHash: await hashPassword(password) })
    .onConflictDoUpdate({ target: users.email, set: { isActive: true } })
    .returning({ id: users.id });
  const [superRole] = await db.select({ id: roles.id }).from(roles).where(eq(roles.name, SUPER_ROLE));
  await db.insert(userRoles).values({ userId: u!.id, roleId: superRole!.id }).onConflictDoNothing();
  log(`super admin: ${email}`);
}

async function ensureMenus() {
  // Menu "Pengaturan" versi lama → "Profil & Biodata" (settings key-value digantikan tabel profile)
  await db.update(menus).set({ label: "Profil & Biodata", icon: "UserCircle", path: "/admin/profile" }).where(eq(menus.path, "/admin/settings"));
  await db.update(menus).set({ path: "/admin/experience" }).where(eq(menus.path, "/admin/experiences"));

  type Row = { id: string; parentId: string | null; label: string; icon: string; path: string; permissionKey: string | null; sortOrder: number };
  const admin: Row[] = [
    { id: M("01"), parentId: null, label: "Dashboard", icon: "LayoutDashboard", path: "/admin", permissionKey: null, sortOrder: 0 },
    { id: M("03"), parentId: null, label: "Profil & Biodata", icon: "UserCircle", path: "/admin/profile", permissionKey: "profile.read", sortOrder: 1 },
    { id: M("08"), parentId: null, label: "Pengalaman", icon: "Briefcase", path: "/admin/experience", permissionKey: "experience.read", sortOrder: 2 },
    { id: M("09"), parentId: null, label: "Sertifikasi", icon: "Award", path: "/admin/certification", permissionKey: "certification.read", sortOrder: 3 },
    { id: M("0a"), parentId: null, label: "Skill", icon: "Sparkles", path: "/admin/skill", permissionKey: "skill.read", sortOrder: 4 },
    { id: M("02"), parentId: null, label: "Project", icon: "FolderKanban", path: "/admin/projects", permissionKey: "project.read", sortOrder: 5 },
    { id: M("04"), parentId: null, label: "Master Data", icon: "Database", path: "#", permissionKey: null, sortOrder: 8 },
    { id: M("05"), parentId: M("04"), label: "Menu Dinamis", icon: "ListTree", path: "/admin/menus", permissionKey: "menu.read", sortOrder: 0 },
    { id: M("06"), parentId: M("04"), label: "Pengguna", icon: "Users", path: "/admin/users", permissionKey: "user.read", sortOrder: 1 },
    { id: M("07"), parentId: M("04"), label: "Role & Akses", icon: "ShieldCheck", path: "/admin/roles", permissionKey: "role.read", sortOrder: 2 },
    { id: M("0c"), parentId: null, label: "Layanan & Pembayaran", icon: "Wallet", path: "#", permissionKey: null, sortOrder: 6 },
    { id: M("0d"), parentId: M("0c"), label: "Paket Layanan", icon: "Package", path: "/admin/packages", permissionKey: "package.read", sortOrder: 0 },
    { id: M("0e"), parentId: M("0c"), label: "Order", icon: "ShoppingCart", path: "/admin/orders", permissionKey: "order.read", sortOrder: 1 },
    { id: M("0f"), parentId: M("0c"), label: "Tagihan", icon: "Receipt", path: "/admin/invoices", permissionKey: "invoice.read", sortOrder: 2 },
    { id: M("10"), parentId: M("0c"), label: "Pelanggan", icon: "Handshake", path: "/admin/customers", permissionKey: "customer.read", sortOrder: 3 },
    { id: M("11"), parentId: M("0c"), label: "Pembayaran & QRIS", icon: "QrCode", path: "/admin/payment", permissionKey: "payment.read", sortOrder: 4 },
    { id: M("0b"), parentId: null, label: "Akun Saya", icon: "KeyRound", path: "/admin/account", permissionKey: null, sortOrder: 9 },
  ];
  // Baru → insert; sudah ada → hanya path & permission yang disamakan (label/ikon/urutan kustomisasi admin dipertahankan)
  await db
    .insert(menus)
    .values(admin.map((m) => ({ ...m, scope: "ADMIN" as const })))
    .onConflictDoUpdate({ target: menus.id, set: { path: sql`excluded.path`, permissionKey: sql`excluded.permission_key` } });

  const [pub] = await db.select({ n: sql<number>`count(*)::int` }).from(menus).where(eq(menus.scope, "PUBLIC"));
  if ((pub?.n ?? 0) === 0) {
    const items = [["Tentang", "#tentang"], ["Biodata", "#biodata"], ["Pengalaman", "#pengalaman"], ["Skill", "#skill"], ["Sertifikasi", "#sertifikasi"], ["Proyek", "#proyek"], ["Kontak", "#kontak"]] as const;
    await db.insert(menus).values(items.map(([label, path], i) => ({ scope: "PUBLIC" as const, label, path, icon: "Globe", sortOrder: i })));
    log("menu PUBLIC dibuat");
  }
  // menu ADMIN lama tanpa permission tetap aman: hanya tampil setelah login
  await db.update(menus).set({ permissionKey: null }).where(and(eq(menus.scope, "ADMIN"), isNull(menus.permissionKey)));
}

async function ensureProfile() {
  await db.insert(profile).values({ id: 1 }).onConflictDoNothing();
  await db.insert(paymentSettings).values({ id: 1 }).onConflictDoNothing();
  // nama tampilan super admin bawaan ("Super Admin") → nama pemilik dari profil, agar sapaan di halaman jasa/admin tidak "Halo, Super"
  const [p] = await db.select({ fullName: profile.fullName }).from(profile).where(eq(profile.id, 1)).limit(1);
  if (p?.fullName) {
    const renamed = await db.update(users).set({ name: p.fullName }).where(eq(users.name, "Super Admin")).returning({ id: users.id });
    if (renamed.length) log(`nama super admin → ${p.fullName}`);
  }
}

async function main() {
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? "./drizzle" });
  log("migrasi SQL selesai");
  await syncPermissions();
  await ensureRoles();
  await ensureSuperAdmin();
  await ensureMenus();
  await ensureProfile();
  await seedContent(db, log);
  log("seed selesai");
}

main()
  .catch((e) => {
    console.error("[migrate] GAGAL:", e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
