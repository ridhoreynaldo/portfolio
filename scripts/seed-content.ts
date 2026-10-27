/**
 * Seed konten awal (profil, pengalaman, sertifikasi, skill, project, paket layanan) — IDEMPOTEN dan TIDAK menimpa:
 *  - profil: hanya kolom yang masih kosong yang diisi
 *  - pengalaman / sertifikasi / skill / paket: hanya bila tabelnya masih kosong
 *  - project: per slug (yang sudah ada dibiarkan; yang belum ada ditambahkan)
 * Semua bisa diubah lewat panel admin setelahnya.
 */
import { eq, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/shared/db/schema";

type Db = PostgresJsDatabase<typeof schema>;
const { profile, experiences, certifications, skills, projects, servicePackages, menus } = schema;

const PROFILE: Partial<typeof profile.$inferInsert> = {
  siteName: "Ridho Reynaldo",
  fullName: "Ridho Reynaldo",
  headline: "Back-End Developer & Machine Learning Engineer",
  tagline: "Full Stack Engineer · Universitas Quality",
  summary: "Membangun sistem back-end yang scalable dan mengeksplorasi Machine Learning untuk solusi teknologi yang berdampak.",
  about:
    "Saat ini fokus pada Back-End Development dan Cloud Computing, aktif membangun dan belajar melalui proyek nyata: sistem informasi akademik, manajemen aset, pembayaran asrama, WhatsApp gateway, hingga sistem pendukung keputusan berbasis machine learning.\n\nSenang menjadi mentor bagi mahasiswa, khususnya dalam menyelesaikan tugas akhir di bidang Computer Science dan algoritma Machine Learning. Juga memperluas pengetahuan di bidang Cybersecurity, serta memiliki dasar kuat dalam IT Support (troubleshooting perangkat keras dan lunak).\n\nMenerima jasa konsultasi teknis, pembuatan aplikasi (web, API, machine learning/DSS), sewa & maintenance server, serta mentoring tugas akhir.",
  location: "Medan Kota, Sumatera Utara, Indonesia",
  nationality: "Indonesia",
  github: "https://github.com/ridhoreynaldo",
  linkedin: "https://www.linkedin.com/in/ridhoreynaldo",
  website: "https://ridhoreynaldo.com",
  serviceBrand: "NEXORBIT",
  serviceTagline: "Software · Cloud · AI Services",
};

const EXPERIENCES: (typeof experiences.$inferInsert)[] = [
  { position: "Full Stack Engineer", company: "Universitas Quality", location: "Medan", startDate: "Agu 2025", isCurrent: true, icon: "server", sortOrder: 0,
    description: "Membangun sistem asset management, villa, task management & reporting inventaris, serta portal akademik (SIAKAD) universitas. Backend Laravel/PHP, deploy dengan Docker di Windows Server dan Linux." },
  { position: "Co-Mentor — LenteRAI by RuangAI", company: "CODEPOLITAN (Freelance)", location: "Remote", startDate: "Sep 2025", endDate: "Nov 2025", icon: "users", sortOrder: 1,
    description: "Membimbing peserta program AI melalui inisiatif LenteRAI, termasuk sesi Train the Trainer." },
  { position: "Backend Developer (Virtual Internship)", company: "Evermos", location: "Remote", startDate: "Sep 2025", endDate: "Okt 2025", icon: "code", sortOrder: 2,
    description: "Project-based internship berfokus pada AI & Machine Learning menggunakan Go dan MySQL." },
  { position: "Laravel Developer (Intern)", company: "Bank Rakyat Indonesia (BRI)", location: "Indonesia", startDate: "Feb 2024", endDate: "Mei 2024", icon: "briefcase", sortOrder: 3,
    description: "Mengembangkan & mengoptimasi aplikasi BRISPOT dengan PHP Laravel & JavaScript untuk proses bisnis kredit." },
  { position: "Back End Engineer Bootcamp", company: "Binar Academy", location: "Remote", startDate: "Jun 2024", endDate: "Sep 2024", icon: "graduation", sortOrder: 4,
    description: "Bootcamp intensif 4 bulan: RESTful API dengan Node.js, Express.js, Prisma & PostgreSQL, CI/CD dengan GitHub Actions. Nilai akhir 92,4." },
  { position: "Scalable Web Service with Golang (FGA)", company: "Hacktiv8 Indonesia × Digital Talent Scholarship", location: "Remote", startDate: "Feb 2024", endDate: "Mar 2024", icon: "graduation", sortOrder: 5,
    description: "Bootcamp fundamental Go: concurrency, integrasi SQL, REST API, middleware, testing & deployment. Terpilih sebagai Top Participant FGA Batch 1 (April 2024)." },
  { position: "Bachelor of Science — Computer Science", company: "Universitas Islam Negeri Sumatera Utara", location: "Medan", startDate: "Jun 2016", endDate: "Nov 2023", icon: "graduation", sortOrder: 6,
    description: "Fokus pada algoritma, pemrograman, dan machine learning. IPK 3,53." },
];

const CERTIFICATIONS: (typeof certifications.$inferInsert)[] = [
  { name: "Microsoft Certified: Azure AI Fundamentals", issuer: "Microsoft (skor 842/1000)", issueDate: "2025-07-01", sortOrder: 0 },
  { name: "CCNA Network Engineer", issuer: "Digital Talent Scholarship — Kominfo", issueDate: "2024-02-01", sortOrder: 1 },
  { name: "Data Classification & Summarization (IBM Granite)", issuer: "IBM SkillsBuild", issueDate: "2025-01-01", sortOrder: 2 },
  { name: "Code Generation & Optimization (IBM Granite)", issuer: "IBM SkillsBuild", issueDate: "2025-01-01", sortOrder: 3 },
  { name: "Top Participant — Fresh Graduate Academy Batch 1", issuer: "Hacktiv8 Indonesia × Digital Talent Scholarship", issueDate: "2024-04-01", sortOrder: 4 },
  { name: "Bronze — APJC NetAcad Riders Competition (top 15% global)", issuer: "Cisco Networking Academy", issueDate: "2024-03-01", sortOrder: 5 },
];

const SKILLS: (typeof skills.$inferInsert)[] = [
  { category: "Back-End", name: "Laravel / PHP", level: 90, sortOrder: 0 },
  { category: "Back-End", name: "Node.js / Express.js", level: 82, sortOrder: 1 },
  { category: "Back-End", name: "Go (Golang)", level: 72, sortOrder: 2 },
  { category: "Back-End", name: "Next.js / TypeScript", level: 80, sortOrder: 3 },
  { category: "Machine Learning", name: "Python & algoritma ML", level: 82, sortOrder: 0 },
  { category: "Machine Learning", name: "K-Means, AHP, SMART (DSS)", level: 85, sortOrder: 1 },
  { category: "Machine Learning", name: "IBM Granite / Azure AI", level: 70, sortOrder: 2 },
  { category: "Database", name: "PostgreSQL", level: 85, sortOrder: 0 },
  { category: "Database", name: "MySQL / MariaDB", level: 88, sortOrder: 1 },
  { category: "Database", name: "Redis", level: 70, sortOrder: 2 },
  { category: "Cloud & DevOps", name: "Docker & Nginx", level: 85, sortOrder: 0 },
  { category: "Cloud & DevOps", name: "CI/CD (GitHub Actions)", level: 80, sortOrder: 1 },
  { category: "Cloud & DevOps", name: "Microsoft Azure", level: 72, sortOrder: 2 },
  { category: "Cloud & DevOps", name: "Linux Server", level: 82, sortOrder: 3 },
  { category: "Cybersecurity & IT Support", name: "Network Fundamentals (CCNA)", level: 78, sortOrder: 0 },
  { category: "Cybersecurity & IT Support", name: "Troubleshooting HW/SW", level: 88, sortOrder: 1 },
];

const PROJECTS: (typeof projects.$inferInsert)[] = [
  {
    title: "SIAKAD — Portal Akademik Universitas Quality", slug: "siakad-universitas-quality", year: 2025, role: "Full Stack Engineer", isFeatured: true, sortOrder: 0,
    description: "Sistem informasi akademik universitas: data mahasiswa & dosen, KRS, jadwal, nilai/KHS, dan administrasi akademik dalam satu portal.",
    detailDescription: "Portal akademik terpadu untuk Universitas Quality. Modul: master mahasiswa/dosen/prodi, kurikulum & mata kuliah, KRS & persetujuan dosen wali, jadwal perkuliahan, input nilai & transkrip, serta role-based access untuk mahasiswa, dosen, dan bagian akademik.\n\nBackend Laravel/PHP dengan MySQL/MariaDB, di-deploy menggunakan Docker dan nginx reverse proxy dengan SSL.",
    tags: ["Laravel", "PHP", "MySQL", "Docker"], techStack: ["Laravel", "PHP", "MySQL", "Docker", "Nginx", "JavaScript"], demoUrl: "https://portaluniversitasquality.ac.id",
  },
  {
    title: "Manajemen Aset & Pembayaran Asrama", slug: "manajemen-aset-pembayaran-asrama", year: 2025, role: "Full Stack Engineer", isFeatured: true, sortOrder: 1,
    description: "Aplikasi manajemen aset kampus (inventaris, villa, task management, laporan) dan sistem tagihan & pembayaran asrama mahasiswa.",
    detailDescription: "Dua modul dalam satu platform internal:\n• Asset management: pendataan aset & inventaris, peminjaman, mutasi, task management perawatan, dan reporting.\n• Pembayaran asrama: penghuni, kamar, tagihan bulanan, pencatatan pembayaran, dan rekap keuangan untuk pengelola asrama.\n\nBackend Laravel/PHP, database MySQL, berjalan dalam Docker di Windows Server.",
    tags: ["Laravel", "PHP", "MySQL", "Docker"], techStack: ["Laravel", "PHP", "MySQL", "Docker", "JavaScript"],
  },
  {
    title: "Sistem Pendukung Keputusan (DSS) — AHP & SMART", slug: "dss-ahp-smart", year: 2026, role: "Developer & Analis", isFeatured: true, sortOrder: 2,
    description: "DSS multi-kriteria dengan metode AHP (bobot kriteria berpasangan) dan SMART (penilaian alternatif) untuk pemeringkatan keputusan.",
    detailDescription: "Aplikasi pendukung keputusan yang mengimplementasikan metode AHP untuk menghitung bobot kriteria lewat matriks perbandingan berpasangan (dengan uji konsistensi CR) dan metode SMART untuk menilai alternatif. Hasil berupa peringkat alternatif beserta rincian perhitungan tiap tahap, cocok untuk kebutuhan skripsi/riset maupun pengambilan keputusan organisasi.",
    tags: ["Laravel", "DSS", "AHP", "SMART"], techStack: ["Laravel", "PHP", "MySQL", "JavaScript"],
  },
  {
    title: "Clustering Produk dengan K-Means (Machine Learning)", slug: "ml-kmeans-clustering-produk", year: 2026, role: "Machine Learning Developer", isFeatured: true, sortOrder: 3,
    description: "Aplikasi machine learning untuk mengelompokkan produk/data dengan algoritma K-Means: inisialisasi centroid, iterasi, hasil cluster, dan riwayat.",
    detailDescription: "Pipeline K-Means lengkap di dalam aplikasi web: unggah/kelola data, inisialisasi centroid (manual/otomatis), proses iterasi hingga konvergen, visualisasi hasil cluster, dan penyimpanan riwayat clustering untuk dibandingkan antar percobaan. Dirancang sebagai alat bantu analisis dan bahan pembelajaran algoritma ML.",
    tags: ["Machine Learning", "K-Means", "Laravel", "Python"], techStack: ["Laravel", "PHP", "MySQL", "Python"],
  },
  {
    title: "WhatsApp Gateway Multi-Sesi", slug: "wa-gateway", year: 2026, role: "Lead Developer", isFeatured: false, sortOrder: 4,
    description: "Gateway WhatsApp dengan REST API berbasis API key, antrian pesan, multi nomor/sesi, dan dashboard admin ber-RBAC.",
    detailDescription: "Layanan pengiriman pesan WhatsApp untuk aplikasi lain (notifikasi, OTP, broadcast). Fitur: multi sesi, antrian job dengan worker terpisah, rate limit per API key, log pengiriman, dan panel admin. Stack Next.js + TypeScript, PostgreSQL (Drizzle ORM), Redis queue, Docker.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Redis"], techStack: ["Next.js", "TypeScript", "PostgreSQL", "Redis", "Docker"], repoUrl: "https://github.com/ridhoreynaldo/wa-gateway",
  },
  {
    title: "Bimbel Adzkia — Landing, Bot WhatsApp & Dashboard", slug: "bimbel-adzkia", year: 2026, role: "Full Stack Developer", isFeatured: false, sortOrder: 5,
    description: "Website bimbingan belajar dengan pendaftaran online, bot WhatsApp satu nomor untuk layanan siswa/orang tua, dan dashboard admin.",
    detailDescription: "Landing page bimbel dengan formulir pendaftaran, bot WhatsApp (satu nomor) untuk informasi jadwal/tagihan/pengumuman, serta dashboard admin untuk mengelola siswa, kelas, dan pembayaran. Next.js + PostgreSQL, terintegrasi dengan WhatsApp gateway.",
    tags: ["Next.js", "PostgreSQL", "WhatsApp"], techStack: ["Next.js", "TypeScript", "PostgreSQL", "Docker"],
  },
  {
    title: "Infrastruktur DevOps Satu Server", slug: "devops-infra", year: 2026, role: "DevOps", isFeatured: false, sortOrder: 6,
    description: "Repo infra bersama: nginx gateway + SSL, PostgreSQL + PgBouncer, Redis, monitoring (Prometheus, Grafana, Uptime Kuma), backup otomatis.",
    detailDescription: "Satu server, satu repo infra, banyak aplikasi. Bootstrap idempotent untuk server baru, satu vhost per domain, database & role per aplikasi, limit resource per container, rotasi log, backup PostgreSQL ke Google Drive, dan skrip deploy aplikasi dari git.",
    tags: ["Docker", "Nginx", "PostgreSQL", "Linux"], techStack: ["Docker", "Nginx", "PostgreSQL", "Redis", "Linux", "Git"], repoUrl: "https://github.com/ridhoreynaldo/devops",
  },
  {
    title: "BRISPOT — Optimasi Aplikasi Proses Kredit (BRI)", slug: "brispot-bri", year: 2024, role: "Laravel Developer (Intern)", isFeatured: false, sortOrder: 7,
    description: "Pengembangan dan optimasi fitur aplikasi BRISPOT untuk proses bisnis kredit Bank Rakyat Indonesia.",
    detailDescription: "Selama magang di BRI: pengembangan fitur, perbaikan bug, dan optimasi performa aplikasi BRISPOT dengan PHP Laravel & JavaScript, mengikuti standar pengembangan perbankan.",
    tags: ["Laravel", "PHP", "JavaScript"], techStack: ["Laravel", "PHP", "JavaScript", "MySQL"],
  },
  {
    title: "Portofolio + Portal Layanan & Pembayaran", slug: "portfolio-v2", year: 2026, role: "Lead Developer", isFeatured: false, sortOrder: 8,
    description: "Situs ini: portofolio dengan panel admin RBAC granular, katalog jasa, order pelanggan, tagihan bulanan, dan pembayaran QRIS.",
    detailDescription: "Next.js 16 + React 19 + Drizzle ORM + PostgreSQL (PgBouncer). Fitur: konten dinamis, menu dinamis, role & permission granular, portal pelanggan (order, tagihan, unggah bukti bayar), QRIS, dan deploy Docker di balik nginx + Cloudflare.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Docker"], techStack: ["Next.js", "React", "TypeScript", "Drizzle", "PostgreSQL", "Tailwind", "Docker"], repoUrl: "https://github.com/ridhoreynaldo/portfolio",
  },
];

const PACKAGES: (typeof servicePackages.$inferInsert)[] = [
  { name: "Konsultasi Teknis (1 sesi)", slug: "konsultasi-teknis", category: "Konsultasi", price: 150_000, billingCycle: "once", unit: "sesi", isFeatured: false, sortOrder: 0,
    description: "Sesi konsultasi 60 menit via Google Meet/WhatsApp: arsitektur aplikasi, database, deployment, atau machine learning.",
    features: ["60 menit via Meet / WhatsApp", "Review kode atau arsitektur", "Rekomendasi tertulis setelah sesi"] },
  { name: "Pembuatan Aplikasi Web Custom", slug: "pembuatan-aplikasi-web", category: "Pembuatan Aplikasi", price: 0, billingCycle: "once", unit: "", isFeatured: true, sortOrder: 1,
    description: "Aplikasi web sesuai kebutuhan: sistem informasi, dashboard admin, REST API, integrasi WhatsApp/pembayaran. Harga mengikuti scope.",
    features: ["Analisis kebutuhan & desain database", "Backend Laravel / Next.js / Go", "Panel admin + role & permission", "Deploy ke server + SSL", "Garansi bug 30 hari"] },
  { name: "Landing Page + Dashboard Admin", slug: "landing-page-admin", category: "Pembuatan Aplikasi", price: 2_500_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 2,
    description: "Website profil usaha/lembaga dengan halaman admin untuk mengelola konten, formulir pendaftaran, dan integrasi WhatsApp.",
    features: ["Desain responsif", "Konten dikelola dari admin", "Form pendaftaran / kontak", "SEO dasar + SSL"] },
  { name: "Aplikasi Machine Learning / DSS", slug: "aplikasi-ml-dss", category: "Pembuatan Aplikasi", price: 1_500_000, billingCycle: "once", unit: "", isFeatured: true, sortOrder: 3,
    description: "Implementasi algoritma (K-Means, AHP, SMART, klasifikasi, regresi, dll) menjadi aplikasi web lengkap untuk skripsi, riset, atau operasional.",
    features: ["Konsultasi metode & dataset", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"] },
  { name: "Mentoring Tugas Akhir (CS / ML)", slug: "mentoring-tugas-akhir", category: "Mentoring", price: 500_000, billingCycle: "monthly", unit: "", isFeatured: false, sortOrder: 4,
    description: "Pendampingan bulanan menyelesaikan skripsi/tugas akhir bidang Computer Science dan algoritma Machine Learning.",
    features: ["4 sesi bimbingan per bulan", "Review kode & bab metodologi", "Simulasi sidang"] },
  { name: "Sewa Hosting + Maintenance Aplikasi", slug: "sewa-hosting-maintenance", category: "Sewa", price: 250_000, billingCycle: "monthly", unit: "aplikasi", isFeatured: true, sortOrder: 5,
    description: "Aplikasi Anda berjalan di server terkelola: Docker, nginx + SSL, backup database harian, monitoring, dan pembaruan keamanan.",
    features: ["Server terkelola + SSL", "Backup DB harian", "Monitoring uptime", "Perbaikan bug minor"] },
  { name: "Sewa WhatsApp Gateway", slug: "sewa-whatsapp-gateway", category: "Sewa", price: 350_000, billingCycle: "monthly", unit: "nomor", isFeatured: false, sortOrder: 6,
    description: "API pengiriman pesan WhatsApp untuk notifikasi/OTP aplikasi Anda, lengkap dengan dashboard & log.",
    features: ["REST API + API key", "Antrian & retry otomatis", "Dashboard log pengiriman", "Dukungan integrasi"] },
  { name: "Maintenance & Support Bulanan", slug: "maintenance-support", category: "Maintenance", price: 300_000, billingCycle: "monthly", unit: "", isFeatured: false, sortOrder: 7,
    description: "Pemeliharaan aplikasi yang sudah berjalan: perbaikan bug, update dependensi, dan dukungan prioritas via WhatsApp.",
    features: ["Respon < 24 jam", "Update keamanan rutin", "Laporan bulanan"] },
];

export async function seedContent(db: Db, log: (m: string) => void) {
  // profil: isi hanya kolom yang masih kosong
  const [p] = await db.select().from(profile).where(eq(profile.id, 1)).limit(1);
  if (p) {
    const patch: Record<string, string> = {};
    for (const [k, v] of Object.entries(PROFILE)) if (typeof v === "string" && !(p as Record<string, unknown>)[k]) patch[k] = v;
    if (Object.keys(patch).length) {
      await db.update(profile).set(patch).where(eq(profile.id, 1));
      log(`profil: ${Object.keys(patch).length} kolom kosong diisi`);
    }
  }

  const count = async (t: typeof experiences | typeof certifications | typeof skills | typeof servicePackages) =>
    (await db.select({ n: sql<number>`count(*)::int` }).from(t))[0]!.n;

  if ((await count(experiences)) === 0) { await db.insert(experiences).values(EXPERIENCES); log(`pengalaman: ${EXPERIENCES.length} baris`); }
  if ((await count(certifications)) === 0) { await db.insert(certifications).values(CERTIFICATIONS); log(`sertifikasi: ${CERTIFICATIONS.length} baris`); }
  if ((await count(skills)) === 0) { await db.insert(skills).values(SKILLS); log(`skill: ${SKILLS.length} baris`); }
  if ((await count(servicePackages)) === 0) { await db.insert(servicePackages).values(PACKAGES); log(`paket layanan: ${PACKAGES.length} baris`); }

  const added = await db.insert(projects).values(PROJECTS).onConflictDoNothing({ target: projects.slug }).returning({ slug: projects.slug });
  if (added.length) log(`project baru: ${added.map((a) => a.slug).join(", ")}`);

  // menu PUBLIC "Jasa" → halaman /jasa (dulu section #layanan di beranda; dimigrasi otomatis)
  const migrated = await db.update(menus).set({ label: "Jasa", path: "/jasa" }).where(sql`${menus.scope} = 'PUBLIC' and ${menus.path} = '#layanan'`).returning({ id: menus.id });
  if (migrated.length) log("menu PUBLIC Layanan (#layanan) diarahkan ke /jasa");
  const [hasJasa] = await db.select({ id: menus.id }).from(menus).where(sql`${menus.scope} = 'PUBLIC' and ${menus.path} = '/jasa'`).limit(1);
  if (!hasJasa) {
    await db.update(menus).set({ sortOrder: sql`${menus.sortOrder} + 1` }).where(sql`${menus.scope} = 'PUBLIC' and ${menus.sortOrder} >= 6`);
    await db.insert(menus).values({ scope: "PUBLIC", label: "Jasa", path: "/jasa", icon: "Globe", sortOrder: 6 });
    log("menu PUBLIC Jasa ditambahkan");
  }
}
