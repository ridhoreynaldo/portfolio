/**
 * Sumber kebenaran permission. Migrate/seed menyinkronkan daftar ini ke tabel `permissions`;
 * admin lalu menentukan role mana memegang permission mana (/admin/roles).
 * Format: `<modul>.<aksi>`. Role sistem (super_admin) selalu lolos semua pengecekan.
 */
export const SUPER_ROLE = "super_admin";

export type PermissionDef = { key: string; description: string; module: string };

const crud = (module: string, title: string): PermissionDef[] =>
  (["read", "create", "update", "delete"] as const).map((a) => ({
    key: `${module}.${a}`,
    description: `${title}: ${a}`,
    module,
  }));

export const PERMISSIONS: PermissionDef[] = [
  { key: "profile.read", description: "Profil & biodata: read", module: "profile" },
  { key: "profile.update", description: "Profil & biodata: update", module: "profile" },
  ...crud("experience", "Pengalaman"),
  ...crud("certification", "Sertifikasi"),
  ...crud("skill", "Skill"),
  ...crud("project", "Project"),
  ...crud("user", "Pengguna"),
  ...crud("role", "Role & hak akses"),
  ...crud("menu", "Menu"),
  // ── Layanan & pembayaran ──
  ...crud("package", "Paket layanan"),
  ...crud("order", "Order pelanggan"),
  ...crud("invoice", "Tagihan"),
  ...crud("customer", "Pelanggan"),
  { key: "payment.read", description: "Pengaturan pembayaran (QRIS/bank): read", module: "payment" },
  { key: "payment.update", description: "Pengaturan pembayaran (QRIS/bank): update", module: "payment" },
];

/** Role pelanggan (portal /portal): login tanpa permission admin. */
export const CUSTOMER_ROLE = "customer";

export const PERMISSION_KEYS = new Set(PERMISSIONS.map((p) => p.key));

/** Permission versi lama (`x.manage`) → permission granular baru. Dipakai seed saat migrasi data. */
export const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
  "menus.manage": crud("menu", "").map((p) => p.key),
  "users.manage": crud("user", "").map((p) => p.key),
  "roles.manage": crud("role", "").map((p) => p.key),
  "projects.manage": crud("project", "").map((p) => p.key),
  "experiences.manage": crud("experience", "").map((p) => p.key),
  "settings.manage": ["profile.read", "profile.update"],
};
