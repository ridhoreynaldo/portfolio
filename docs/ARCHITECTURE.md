# Arsitektur

## Modular monolith (sama dengan wa-gateway)

```
src/
  app/                 routes tipis: baca data dari modul, panggil actions
    page.tsx           halaman publik (data dari cache bertag "portfolio")
    login/             form login (useActionState)
    admin/             layout (sidebar dari DB) + halaman CRUD
    api/health         healthcheck untuk Docker/Uptime Kuma
  components/          UI publik: starfield, project-grid (+modal), tech-icon, exp-icon, field-inputs
  shared/              env, db (postgres.js prepare:false), errors, action wrapper (flash), ui, url (safeUrl)
  modules/
    auth/              schema (auth_sessions), session, password (scrypt + bcrypt legacy), guards, rate-limit, actions
    rbac/              permissions.ts (registry), schema (roles, permissions, role_permissions), repository, actions
    users/             schema (users, user_roles), repository, actions
    menus/             schema, repository (tree admin / nav publik), actions
    content/           schema (profile, experiences, certifications, skills, projects), resources.ts (field deklaratif), repository, actions
    portfolio/         service.ts — view-model publik + cache
scripts/migrate.ts     migrasi SQL + seed idempotent (dibundel esbuild → dist/migrate.mjs untuk container migrate)
drizzle/               migrasi SQL (0000–0003 = versi 1, 0004 = evolusi ke versi 2) + snapshot
```

Aturan:
1. SQL hanya di `repository.ts`. Daftar selalu 1 query dengan JOIN/GROUP BY (role + jumlah user, user + role) — tidak ada N+1.
2. Setiap server action: `requirePermission()` → validasi Zod/parseForm → repository → `revalidatePath` / `revalidatePortfolio()` → flash → redirect. Dibungkus `action()` supaya error validasi/akses jadi pesan flash, bukan halaman error.
3. Halaman: `requirePermissionPage()` (redirect ke dashboard dengan pesan). Dashboard hanya butuh login → tidak ada loop redirect.
4. Tombol UI disembunyikan sesuai `can()`, tapi otorisasi sebenarnya ada di action (UI bukan pengaman).
5. Semua nilai URL dari konten melewati `safeUrl()` saat disimpan **dan** saat dirender.

## RBAC

- Permission `modul.aksi` didefinisikan di `rbac/permissions.ts`; migrate menyinkronkannya ke tabel.
- User punya banyak role (`user_roles`); permission efektif = gabungan. Role dengan `is_system` (super_admin) lolos semua pengecekan dan tidak bisa dibatasi/dihapus.
- Menu admin tampil bila `permission_key` dimiliki user (atau null = cukup login). Menu PUBLIC (`#section`) mengatur section mana yang dirender di halaman publik.
- Anti-eskalasi: lihat `rbac/actions.ts` dan `users/actions.ts` (komentar “Anti eskalasi hak”).

## Caching halaman publik

`/` tetap dinamis (bisa dirender saat build tanpa DB), tetapi datanya dari `unstable_cache(load, ["portfolio"], { tags, revalidate: 3600 })`. Setiap action yang mengubah konten/menu memanggil `revalidateTag("portfolio", "max")`. Hasil: pengunjung tidak memicu query DB kecuali setelah ada perubahan. View-model hanya berisi tipe JSON-safe (tanggal = string `YYYY-MM-DD`).

## Evolusi dari versi 1 (Drizzle + JWT + API routes)

Dipertahankan: semua tabel & data (users, roles, permissions, user_roles, menus, projects, experiences), UUID tetap dari seed lama.
Diubah oleh migrasi `0004` + seed:

| Versi 1 | Versi 2 |
|---|---|
| `site_settings` key-value | tabel `profile` singleton (nilai disalin: hero_title→headline, about_text→about, contact_*→email/phone/linkedin, dst.) lalu `site_settings` di-drop |
| `role_menus` (menu per role) | `menus.permission_key` (menu per permission) — `role_menus` di-drop |
| permission `x.manage` | granular `x.read/create/update/delete`; role pemegang `x.manage` otomatis diberi semua aksi modul itu |
| JWT 7 hari (`jose`) | sesi di tabel `auth_sessions` (bisa dicabut) |
| bcrypt | scrypt; hash bcrypt lama tetap diterima dan di-rehash saat login pertama |
| API routes + fetch di client | server actions |
| `/admin/settings` | `/admin/profile` (path menu diperbaiki otomatis oleh seed) |
| — | tabel baru `certifications`, `skills`; kolom `projects.role`, `projects.year`, `roles.is_system`, `users.last_login_at` |

Catatan migrasi `0004`: ditulis tangan (drizzle-kit butuh prompt interaktif untuk drop+create), snapshot `0004_snapshot.json` dibuat dari skema penuh dan dirantai ke `0003`. `drizzle-kit generate` setelahnya tidak menghasilkan diff.

## Belum ada

- Upload gambar (saat ini URL). Bisa ditambah lewat object storage.
- Rate limit login di memori proses (cukup untuk 1 instance; pindah ke Redis/DB bila di-scale).
- Tes otomatis.
