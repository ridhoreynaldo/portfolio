/**
 * Seed awal database — IDEMPOTENT (aman dijalankan berulang).
 * Semua INSERT memakai ON CONFLICT DO NOTHING dengan UUID tetap.
 *
 * Hanya memakai: pg, bcryptjs (JavaScript polos, tanpa TypeScript).
 * Koneksi: Pool() tanpa argumen membaca PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.
 */
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ max: 5 });
const q = (text, params) => pool.query(text, params);

// UUID tetap agar idempotent
const R_SUPER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const R_ADMIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const R_USER = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const P_MENUS = "11111111-1111-1111-1111-111111111111";
const P_USERS = "22222222-2222-2222-2222-222222222222";
const P_ROLES = "33333333-3333-3333-3333-333333333333";
const P_PROJECTS = "44444444-4444-4444-4444-444444444444";
const P_SETTINGS = "55555555-5555-5555-5555-555555555555";

const M_DASH = "d0000000-0000-0000-0000-000000000001";
const M_PROJECTS = "d0000000-0000-0000-0000-000000000002";
const M_SETTINGS = "d0000000-0000-0000-0000-000000000003";
const M_MASTER = "d0000000-0000-0000-0000-000000000004";
const M_MENUS = "d0000000-0000-0000-0000-000000000005";
const M_USERS = "d0000000-0000-0000-0000-000000000006";
const M_ROLES = "d0000000-0000-0000-0000-000000000007";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib diisi");
  }

  // --- Roles ---
  const roles = [
    [R_SUPER, "super_admin", "Akses penuh ke seluruh sistem"],
    [R_ADMIN, "admin", "Mengelola konten dan pengaturan situs"],
    [R_USER, "user", "Akses dasar dashboard"],
  ];
  for (const [id, name, desc] of roles) {
    await q(
      `INSERT INTO roles (id, name, description) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO NOTHING`,
      [id, name, desc]
    );
  }

  // --- Permissions ---
  const perms = [
    [P_MENUS, "menus.manage", "Mengelola menu dinamis"],
    [P_USERS, "users.manage", "Mengelola pengguna"],
    [P_ROLES, "roles.manage", "Mengelola peran & hak akses"],
    [P_PROJECTS, "projects.manage", "Mengelola proyek portfolio"],
    [P_SETTINGS, "settings.manage", "Mengelola pengaturan situs"],
  ];
  for (const [id, key, desc] of perms) {
    await q(
      `INSERT INTO permissions (id, key, description) VALUES ($1,$2,$3)
       ON CONFLICT (id) DO NOTHING`,
      [id, key, desc]
    );
  }

  // --- Role <-> Permission ---
  const allPermIds = perms.map((p) => p[0]);
  for (const pid of allPermIds) {
    await q(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [R_SUPER, pid]
    );
  }
  for (const pid of [P_PROJECTS, P_SETTINGS]) {
    await q(
      `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [R_ADMIN, pid]
    );
  }

  // --- User super admin ---
  const hash = bcrypt.hashSync(adminPassword, 10);
  await q(
    `INSERT INTO users (email, name, password_hash, is_active)
     VALUES ($1,$2,$3,true)
     ON CONFLICT (email) DO NOTHING`,
    [adminEmail, "Administrator", hash]
  );
  const { rows } = await q(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
  const adminId = rows[0].id;
  await q(
    `INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [adminId, R_SUPER]
  );

  // --- Menus ---
  const menus = [
    // id, parentId, label, icon, path, sortOrder
    [M_DASH, null, "Dashboard", "LayoutDashboard", "/admin", 0],
    [M_PROJECTS, null, "Proyek", "FolderKanban", "/admin/projects", 1],
    [M_SETTINGS, null, "Pengaturan", "Settings", "/admin/settings", 2],
    [M_MASTER, null, "Master Data", "Database", "#", 3],
    [M_MENUS, M_MASTER, "Menu Dinamis", "ListTree", "/admin/menus", 0],
    [M_USERS, M_MASTER, "Pengguna", "Users", "/admin/users", 1],
    [M_ROLES, M_MASTER, "Peran & Akses", "ShieldCheck", "/admin/roles", 2],
  ];
  for (const [id, parentId, label, icon, path, sortOrder] of menus) {
    await q(
      `INSERT INTO menus (id, parent_id, label, icon, path, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,true)
       ON CONFLICT (id) DO NOTHING`,
      [id, parentId, label, icon, path, sortOrder]
    );
  }

  // --- Role <-> Menu ---
  const menuIds = menus.map((m) => m[0]);
  for (const mid of menuIds) {
    await q(
      `INSERT INTO role_menus (role_id, menu_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [R_SUPER, mid]
    );
  }
  for (const mid of [M_DASH, M_PROJECTS, M_SETTINGS]) {
    await q(
      `INSERT INTO role_menus (role_id, menu_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [R_ADMIN, mid]
    );
  }
  await q(
    `INSERT INTO role_menus (role_id, menu_id) VALUES ($1,$2)
     ON CONFLICT DO NOTHING`,
    [R_USER, M_DASH]
  );

  // --- Site settings ---
  const settings = [
    ["site_name", "Portfolio Saya"],
    ["tagline", "Membangun solusi digital yang andal & elegan"],
    ["hero_title", "Halo, saya seorang Developer"],
    [
      "hero_subtitle",
      "Saya merancang dan membangun aplikasi web modern — dari backend yang kokoh hingga antarmuka yang memukau.",
    ],
    [
      "about_text",
      "Saya seorang pengembang perangkat lunak yang berfokus pada aplikasi web. Saya senang mengubah ide menjadi produk yang cepat, aman, dan mudah digunakan. Keahlian saya meliputi Next.js, PostgreSQL, dan Docker.",
    ],
    ["email", "halo@example.com"],
    ["github_url", "https://github.com/"],
    ["linkedin_url", "https://linkedin.com/"],
  ];
  for (const [key, value] of settings) {
    await q(
      `INSERT INTO site_settings (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO NOTHING`,
      [key, value]
    );
  }

  // --- Contoh proyek ---
  const sampleProjects = [
    [
      "e0000000-0000-0000-0000-000000000001",
      "Sistem Informasi Akademik",
      "siakad",
      "Aplikasi web untuk pengelolaan data akademik: mahasiswa, KRS, nilai, dan jadwal kuliah. Dibangun dengan arsitektur modular dan hak akses berbasis peran.",
      ["Next.js", "PostgreSQL", "Docker"],
      true,
    ],
    [
      "e0000000-0000-0000-0000-000000000002",
      "WhatsApp Gateway",
      "wa-gateway",
      "Gateway WhatsApp multi-device untuk notifikasi dan broadcast otomatis, lengkap dengan dashboard monitoring dan antrean pesan.",
      ["Node.js", "Baileys", "Redis"],
      true,
    ],
    [
      "e0000000-0000-0000-0000-000000000003",
      "Dashboard Monitoring",
      "dashboard-monitoring",
      "Dashboard pemantauan infrastruktur real-time dengan metrik server, status layanan, dan peringatan otomatis.",
      ["Next.js", "Prometheus", "Grafana"],
      false,
    ],
  ];
  for (const [id, title, slug, desc, tags, featured] of sampleProjects) {
    await q(
      `INSERT INTO projects (id, title, slug, description, tags, is_featured, is_published, sort_order)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,true,0)
       ON CONFLICT (id) DO NOTHING`,
      [id, title, slug, desc, JSON.stringify(tags), featured]
    );
  }

  console.log("[seed] Selesai — data awal siap.");
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error("[seed] Gagal:", e.message);
    process.exit(1);
  });
