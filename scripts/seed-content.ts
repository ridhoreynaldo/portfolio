/**
 * Seed konten awal (profil, pengalaman, sertifikasi, skill, project, paket layanan) — IDEMPOTEN dan TIDAK menimpa:
 *  - profil: hanya kolom yang masih kosong yang diisi
 *  - pengalaman / sertifikasi / skill / paket: hanya bila tabelnya masih kosong
 *  - project: per slug (yang sudah ada dibiarkan; yang belum ada ditambahkan)
 * Semua bisa diubah lewat panel admin setelahnya.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/shared/db/schema";
import type { PriceTier } from "@/modules/billing/schema";

type Db = PostgresJsDatabase<typeof schema>;
const { profile, experiences, certifications, skills, projects, servicePackages, menus, users, orders, invoices } = schema;

const PROFILE: Partial<typeof profile.$inferInsert> = {
  siteName: "Ridho Reynaldo",
  fullName: "Ridho Reynaldo",
  headline: "Back-End Developer & Machine Learning Engineer",
  tagline: "Full Stack Engineer · Universitas Quality",
  summary: "Membangun sistem back-end yang scalable dan mengeksplorasi Machine Learning untuk solusi teknologi yang berdampak.",
  about:
    "Saat ini fokus pada Back-End Development dan Cloud Computing, aktif membangun dan belajar melalui proyek nyata: sistem informasi akademik, manajemen aset, pembayaran asrama, WhatsApp gateway, hingga sistem pendukung keputusan berbasis machine learning.\n\nSenang menjadi mentor bagi mahasiswa, khususnya dalam menyelesaikan tugas akhir di bidang Computer Science dan algoritma Machine Learning. Juga memperluas pengetahuan di bidang Cybersecurity, serta memiliki dasar kuat dalam IT Support (troubleshooting perangkat keras dan lunak).\n\nMenerima jasa konsultasi teknis, pembuatan aplikasi (web, API, machine learning/DSS), sewa & maintenance server, serta mentoring tugas akhir.",
  email: "reynaldoridho@gmail.com",
  phone: "085133891487",
  location: "Medan Kota, Sumatera Utara, Indonesia",
  nationality: "Indonesia",
  github: "https://github.com/ridhoreynaldo",
  linkedin: "https://www.linkedin.com/in/ridhoreynaldo",
  website: "https://ridhoreynaldo.com",
  serviceBrand: "Leetcloud",
  serviceTagline: "Aplikasi, server & WhatsApp gateway untuk bisnis Anda",
};

/** Logo via favicon Google (tanpa kunci API, ukuran 128px); ganti lewat admin bila punya berkas logo sendiri. */
const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
/** Domain resmi perusahaan/penerbit → dipakai seed logo & pelengkap baris lama yang logonya masih kosong (cocok per nama). */
const ORG_DOMAINS: Record<string, string> = {
  "CODEPOLITAN (Freelance)": "codepolitan.com",
  "Evermos": "evermos.com",
  "Bank Rakyat Indonesia (BRI)": "bri.co.id",
  "Binar Academy": "binaracademy.com",
  "Hacktiv8 Indonesia × Digital Talent Scholarship": "hacktiv8.com",
  "Microsoft (skor 842/1000)": "microsoft.com",
  "Digital Talent Scholarship — Kominfo": "digitalent.komdigi.go.id",
  "IBM SkillsBuild": "ibm.com",
  "Cisco Networking Academy": "netacad.com",
};
const logoFor = (org: string) => (ORG_DOMAINS[org] ? favicon(ORG_DOMAINS[org]!) : "");

const EXPERIENCES: (typeof experiences.$inferInsert)[] = [
  { position: "Full Stack Engineer", company: "Universitas Quality", location: "Medan", startDate: "Agu 2025", isCurrent: true, icon: "server", sortOrder: 0,
    description: "Membangun sistem asset management, villa, task management & reporting inventaris, serta portal akademik (SIAKAD) universitas. Backend Laravel/PHP, deploy dengan Docker di Windows Server dan Linux." },
  { position: "Co-Mentor — LenteRAI by RuangAI", company: "CODEPOLITAN (Freelance)", location: "Remote", startDate: "Sep 2025", endDate: "Des 2025", icon: "users", sortOrder: 1,
    description: "Mengajar dan membimbing peserta program LenteRAI AI Fullstack selama 4 bulan: membangun aplikasi fullstack berbasis AI, termasuk sesi Train the Trainer." },
  { position: "Backend Developer (Virtual Internship)", company: "Evermos", location: "Remote", startDate: "Sep 2025", endDate: "Okt 2025", icon: "code", sortOrder: 2,
    description: "Project-based internship berfokus pada AI & Machine Learning menggunakan Go dan MySQL." },
  { position: "Laravel Developer (Magang → Probation)", company: "Bank Rakyat Indonesia (BRI)", location: "Indonesia", startDate: "Feb 2024", endDate: "Feb 2025", icon: "briefcase", sortOrder: 3,
    description: "Dimulai sebagai magang, lanjut masa probation selama sekitar 1 tahun: mengembangkan & mengoptimasi aplikasi BRISPOT dengan PHP Laravel & JavaScript untuk proses bisnis kredit." },
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
    title: "Villa Berastagi Mas — Website & Reservasi Online", slug: "villa-berastagi-mas", year: 2024, role: "Full Stack Developer", isFeatured: true, sortOrder: -1,
    description: "Website reservasi villa di Berastagi, Sumatera Utara: katalog villa, pilih tanggal & jumlah pengunjung, pemesanan lebih dari satu villa sekaligus. Dikelola berkelanjutan dengan langganan bulanan.",
    detailDescription: "Website resmi Villa Berastagi Mas (villaberastagimas.com): halaman villa dengan foto, pencarian ketersediaan berdasarkan tanggal dan jumlah pengunjung (dewasa/anak), pemilihan satu atau beberapa villa untuk reservasi, dan kontak langsung ke pengelola.\n\nProyek berlanjut: server, SSL, backup, pemeliharaan, dan pembaruan fitur dikelola dengan skema langganan bulanan.",
    tags: ["Website", "Reservasi Online", "Langganan Bulanan"], techStack: ["Bootstrap", "jQuery", "Nginx", "SSL"], demoUrl: "https://villaberastagimas.com",
  },
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
    title: "BRISPOT — Optimasi Aplikasi Proses Kredit (BRI)", slug: "brispot-bri", year: 2024, role: "Laravel Developer (Magang → Probation)", isFeatured: false, sortOrder: 7,
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

/** Estimasi sewa server per bulan per aplikasi, berdasarkan jumlah pengguna aktif. */
const SERVER_TIERS: PriceTier[] = [
  { label: "≤ 100 pengguna", price: 350_000 },
  { label: "≤ 500 pengguna", price: 750_000 },
  { label: "≤ 1.000 pengguna", price: 1_250_000 },
  { label: "≤ 5.000 pengguna", price: 2_500_000 },
  { label: "> 5.000 pengguna / high-availability", price: 0 },
];
/** Estimasi WhatsApp gateway per bulan per nomor, berdasarkan pengguna & volume pesan. */
const WA_TIERS: PriceTier[] = [
  { label: "≤ 100 pengguna · ≤ 1.000 pesan/bulan", price: 350_000 },
  { label: "≤ 500 pengguna · ≤ 5.000 pesan/bulan", price: 750_000 },
  { label: "≤ 2.000 pengguna · ≤ 20.000 pesan/bulan", price: 1_500_000 },
  { label: "≤ 5.000 pengguna · ≤ 50.000 pesan/bulan", price: 3_000_000 },
  { label: "> 5.000 pengguna / multi-nomor", price: 0 },
];

const PACKAGES: (typeof servicePackages.$inferInsert)[] = [
  { name: "Konsultasi Teknis (1 sesi)", slug: "konsultasi-teknis", category: "Konsultasi", price: 150_000, billingCycle: "once", unit: "sesi", isFeatured: false, sortOrder: 0,
    description: "Sesi konsultasi 60 menit via Google Meet/WhatsApp: arsitektur aplikasi, database, deployment, atau machine learning.",
    features: ["60 menit via Meet / WhatsApp", "Review kode atau arsitektur", "Rekomendasi tertulis setelah sesi"] },
  { name: "Pembuatan Aplikasi Custom", slug: "pembuatan-aplikasi-web", category: "Pembuatan Aplikasi", price: 0, billingCycle: "once", unit: "", isFeatured: true, sortOrder: 1,
    description: "Aplikasi dibuat sesuai kebutuhan Anda: sistem informasi, dashboard admin, REST API, integrasi WhatsApp/pembayaran, sampai machine learning & DSS. Pilih beli putus (tanpa hosting) atau beli putus + sewa server bulanan.",
    features: ["Analisis kebutuhan & desain database", "Web, API, dashboard, ML/DSS", "Panel admin + role & permission", "Integrasi WhatsApp / pembayaran", "Serah terima kode & dokumentasi", "Garansi bug 30 hari"] },
  { name: "Landing Page + Dashboard Admin", slug: "landing-page-admin", category: "Pembuatan Aplikasi", price: 2_500_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 2,
    description: "Website profil usaha/lembaga dengan halaman admin untuk mengelola konten, formulir pendaftaran, dan integrasi WhatsApp.",
    features: ["Desain responsif", "Konten dikelola dari admin", "Form pendaftaran / kontak", "SEO dasar + SSL"] },
  { name: "Aplikasi Machine Learning / DSS", slug: "aplikasi-ml-dss", category: "Pembuatan Aplikasi", price: 1_500_000, billingCycle: "once", unit: "", isFeatured: true, sortOrder: 3,
    description: "Implementasi algoritma (K-Means, AHP, SMART, klasifikasi, regresi, dll) menjadi aplikasi web lengkap untuk skripsi, riset, atau operasional.",
    features: ["Konsultasi metode & dataset", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"] },
  { name: "Mentoring Tugas Akhir (CS / ML)", slug: "mentoring-tugas-akhir", category: "Mentoring", price: 500_000, billingCycle: "monthly", unit: "", isFeatured: false, sortOrder: 4,
    description: "Pendampingan bulanan menyelesaikan skripsi/tugas akhir bidang Computer Science dan algoritma Machine Learning.",
    features: ["4 sesi bimbingan per bulan", "Review kode & bab metodologi", "Simulasi sidang"] },
  { name: "Layanan Server & Aplikasi", slug: "sewa-server-maintenance", category: "Sewa", price: 2_500_000, billingCycle: "monthly", unit: "aplikasi", isFeatured: true, sortOrder: 5,
    description: "Aplikasi Anda berjalan di cloud server terkelola: nginx + SSL, backup database harian, monitoring, dan pembaruan keamanan. Biaya mengikuti jumlah pengguna aplikasi.",
    features: ["Cloud server terkelola + SSL", "Backup DB harian", "Monitoring uptime", "Perbaikan bug minor", "Kapasitas server naik sesuai tingkat pengguna"],
    priceTiers: SERVER_TIERS },
  { name: "Sewa Domain", slug: "sewa-domain", category: "Sewa", price: 300_000, billingCycle: "yearly", unit: "domain", isActive: false, isFeatured: false, sortOrder: 8,
    description: "Pendaftaran & perpanjangan domain (.com/.id/.sch.id, dll) atas nama Anda, termasuk pengaturan DNS dan pengingat perpanjangan.",
    features: ["Domain atas nama pelanggan", "Pengaturan DNS & subdomain", "Pengingat sebelum kedaluwarsa"] },
  { name: "Sewa WhatsApp Gateway", slug: "sewa-whatsapp-gateway", category: "Sewa", price: 350_000, billingCycle: "monthly", unit: "nomor", isFeatured: false, sortOrder: 6,
    description: "API pengiriman pesan WhatsApp untuk notifikasi/OTP aplikasi Anda, lengkap dengan dashboard & log. Biaya mengikuti jumlah pengguna dan volume pesan per bulan.",
    features: ["REST API + API key", "Antrian & retry otomatis", "Dashboard log pengiriman", "Dukungan integrasi"],
    priceTiers: WA_TIERS },
  { name: "Aplikasi Custom — Sistem Putus", slug: "aplikasi-custom-putus", category: "Pembuatan Aplikasi", price: 2_500_000, billingCycle: "once", unit: "", isFeatured: true, sortOrder: 1,
    description: "Bayar sekali, kode dan aplikasi sepenuhnya milik Anda. Dipasang di server Anda sendiri, atau digabung dengan paket Layanan Server & Aplikasi.",
    features: ["Analisis kebutuhan & desain database", "Web, API & dashboard admin", "Role & permission", "Integrasi WhatsApp / pembayaran", "Serah terima kode & dokumentasi", "Garansi bug 30 hari"],
    priceTiers: [
      { label: "Landing page + dashboard admin", price: 2_500_000 },
      { label: "Sistem informasi sederhana (sampai 5 modul)", price: 6_000_000 },
      { label: "Sistem informasi menengah (6–12 modul, multi-role)", price: 12_000_000 },
      { label: "Sistem kompleks / banyak integrasi", price: 0 },
    ] },
  { name: "Aplikasi Custom — Langganan Bulanan (SaaS)", slug: "aplikasi-custom-saas", category: "Pembuatan Aplikasi", price: 750_000, billingCycle: "monthly", unit: "aplikasi", isFeatured: false, sortOrder: 2,
    description: "Tanpa beli putus: aplikasi dibangun dan dikelola oleh kami, Anda cukup berlangganan bulanan. Server, SSL, backup, perawatan, dan pengembangan berkelanjutan sudah termasuk.",
    features: ["Biaya awal ringan", "Server, SSL, backup & monitoring termasuk", "Perbaikan bug & pembaruan fitur berkala", "Skala naik sesuai jumlah pengguna"],
    priceTiers: [
      { label: "Starter — sampai 50 pengguna, 1 modul utama", price: 750_000 },
      { label: "Bisnis — sampai 200 pengguna, multi-modul", price: 1_500_000 },
      { label: "Pro — sampai 1.000 pengguna, integrasi & laporan", price: 3_000_000 },
      { label: "Enterprise — lebih dari 1.000 pengguna", price: 0 },
    ] },
  { name: "Sistem Pendukung Keputusan (SPK)", slug: "katalog-spk", category: "Katalog Sistem Putus", price: 1_500_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 10,
    description: "SAW, SMART, AHP, TOPSIS, WP, MOORA dan metode lain. Studi kasus seperti di jurnal & skripsi: penilaian kinerja, seleksi, dan kenaikan jabatan karyawan.",
    features: ["Dataset & studi kasus mengikuti jurnal / skripsi", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"],
    priceTiers: [
      { label: "SAW — penilaian kinerja karyawan", price: 1_500_000 },
      { label: "SMART — seleksi penerimaan karyawan", price: 1_500_000 },
      { label: "WP — pemilihan karyawan terbaik / supplier", price: 1_500_000 },
      { label: "MOORA — penentuan kenaikan jabatan", price: 1_750_000 },
      { label: "TOPSIS — penerima bonus & promosi", price: 2_000_000 },
      { label: "AHP — pembobotan kriteria (perbandingan berpasangan)", price: 2_000_000 },
      { label: "ELECTRE / PROMETHEE / VIKOR", price: 2_500_000 },
      { label: "Hybrid AHP + SAW / TOPSIS / SMART", price: 3_000_000 },
    ] },
  { name: "Machine Learning", slug: "katalog-machine-learning", category: "Katalog Sistem Putus", price: 2_000_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 11,
    description: "Klasifikasi, clustering, prediksi, dan pola data: dari dataset Anda sendiri atau dataset studi kasus jurnal.",
    features: ["Dataset & studi kasus mengikuti jurnal / skripsi", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"],
    priceTiers: [
      { label: "K-Means — segmentasi karyawan, pelanggan, atau produk", price: 2_500_000 },
      { label: "Naive Bayes / KNN — klasifikasi (mis. kelayakan karyawan)", price: 2_500_000 },
      { label: "Decision Tree / Random Forest — prediksi kinerja & turnover", price: 3_000_000 },
      { label: "Regresi (Linear / SVR) — prediksi penjualan & gaji", price: 3_000_000 },
      { label: "Apriori / FP-Growth — pola transaksi", price: 2_000_000 },
    ] },
  { name: "Deep Learning", slug: "katalog-deep-learning", category: "Katalog Sistem Putus", price: 4_500_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 12,
    description: "Jaringan saraf untuk citra, deret waktu, dan teks, lengkap dengan antarmuka web untuk mencoba model.",
    features: ["Dataset & studi kasus mengikuti jurnal / skripsi", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"],
    priceTiers: [
      { label: "CNN — klasifikasi citra (mis. absensi wajah)", price: 4_500_000 },
      { label: "LSTM — prediksi deret waktu", price: 4_500_000 },
      { label: "NLP / IndoBERT — analisis sentimen", price: 6_000_000 },
      { label: "YOLO — deteksi objek", price: 6_500_000 },
    ] },
  { name: "Kriptografi & Keamanan Data", slug: "katalog-kriptografi", category: "Katalog Sistem Putus", price: 1_000_000, billingCycle: "once", unit: "", isFeatured: false, sortOrder: 13,
    description: "Enkripsi, tanda tangan digital, dan steganografi yang diimplementasikan sebagai aplikasi web utuh.",
    features: ["Dataset & studi kasus mengikuti jurnal / skripsi", "Perhitungan transparan tiap tahap", "Laporan hasil & dokumentasi", "Bimbingan penggunaan"],
    priceTiers: [
      { label: "Cipher klasik — Caesar, Vigenère, Playfair", price: 1_000_000 },
      { label: "AES — enkripsi file, pesan & data karyawan", price: 2_000_000 },
      { label: "RSA / ElGamal — kriptografi kunci publik", price: 2_500_000 },
      { label: "Steganografi LSB + enkripsi", price: 2_500_000 },
      { label: "Hash & tanda tangan digital — SHA, HMAC, ECDSA", price: 2_500_000 },
    ] },
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

  if ((await count(experiences)) === 0) { await db.insert(experiences).values(EXPERIENCES.map((e) => ({ ...e, logoUrl: logoFor(e.company) }))); log(`pengalaman: ${EXPERIENCES.length} baris`); }
  if ((await count(certifications)) === 0) { await db.insert(certifications).values(CERTIFICATIONS.map((c) => ({ ...c, logoUrl: logoFor(c.issuer) }))); log(`sertifikasi: ${CERTIFICATIONS.length} baris`); }
  // baris lama tanpa logo: isi dari domain yang dikenal (nama persis sama); admin bebas mengganti
  let filled = 0;
  for (const [org, domain] of Object.entries(ORG_DOMAINS)) {
    const a = await db.update(experiences).set({ logoUrl: favicon(domain) }).where(sql`${experiences.company} = ${org} and ${experiences.logoUrl} = ''`).returning({ id: experiences.id });
    const b = await db.update(certifications).set({ logoUrl: favicon(domain) }).where(sql`${certifications.issuer} = ${org} and ${certifications.logoUrl} = ''`).returning({ id: certifications.id });
    filled += a.length + b.length;
  }
  if (filled) log(`logo perusahaan/penerbit diisi: ${filled} baris`);
  if ((await count(skills)) === 0) { await db.insert(skills).values(SKILLS); log(`skill: ${SKILLS.length} baris`); }
  if ((await count(servicePackages)) === 0) { await db.insert(servicePackages).values(PACKAGES); log(`paket layanan: ${PACKAGES.length} baris`); }
  else {
    // Paket sewa versi lama (harga flat, kata "hosting") → nama baru + harga bertingkat; hanya bila belum diubah admin
    const srv = PACKAGES.find((x) => x.slug === "sewa-server-maintenance")!;
    const r1 = await db.update(servicePackages)
      .set({ name: srv.name, slug: srv.slug, description: srv.description, features: srv.features, price: srv.price, priceTiers: srv.priceTiers, updatedAt: new Date() })
      .where(sql`${servicePackages.slug} = 'sewa-hosting-maintenance' and ${servicePackages.price} = 250000`).returning({ id: servicePackages.id });
    if (r1.length) log("paket sewa hosting → Sewa Server + Maintenance Aplikasi (harga bertingkat)");
    const wag = PACKAGES.find((x) => x.slug === "sewa-whatsapp-gateway")!;
    const r2 = await db.update(servicePackages)
      .set({ description: wag.description, priceTiers: wag.priceTiers, updatedAt: new Date() })
      .where(sql`${servicePackages.slug} = 'sewa-whatsapp-gateway' and ${servicePackages.price} = 350000 and ${servicePackages.priceTiers} = '[]'::jsonb`).returning({ id: servicePackages.id });
    if (r2.length) log("paket WhatsApp gateway: harga bertingkat ditambahkan");
  }

  const added = await db.insert(projects).values(PROJECTS).onConflictDoNothing({ target: projects.slug }).returning({ slug: projects.slug });
  if (added.length) log(`project baru: ${added.map((a) => a.slug).join(", ")}`);

  // paket baru yang ditambahkan belakangan (tabel sudah terisi): sisipkan per slug
  const newPk = await db.insert(servicePackages).values(PACKAGES).onConflictDoNothing({ target: servicePackages.slug }).returning({ slug: servicePackages.slug });
  if (newPk.length) log(`paket layanan baru: ${newPk.map((p) => p.slug).join(", ")}`);
  // katalog Leetcloud (28 Okt 2026): paket lama aplikasi custom & sewa domain tidak ditawarkan lagi (data order lama tetap utuh)
  if (newPk.some((p) => p.slug === "aplikasi-custom-putus")) {
    const off = await db.update(servicePackages).set({ isActive: false, updatedAt: new Date() }).where(inArray(servicePackages.slug, ["pembuatan-aplikasi-web", "sewa-domain"])).returning({ slug: servicePackages.slug });
    if (off.length) log(`paket dinonaktifkan: ${off.map((o) => o.slug).join(", ")}`);
  }

  await seedAdzkiaSubscriptions(db, log);
  await fixAdzkiaOctober(db, log);
  await adzkiaCrmAndAbsensi(db, log);
  await adzkiaSubdomainDeploy(db, log);
  await adzkiaBillToAndWording(db, log);
  await renameCrm(db, log);
  await tidyDeployOrders(db, log);
  await simplifyPackages(db, log);

  // menu PUBLIC "Jasa" → halaman /medan (dulu section #layanan di beranda; dimigrasi otomatis)
  const migrated = await db.update(menus).set({ label: "Jasa", path: "/medan" }).where(sql`${menus.scope} = 'PUBLIC' and ${menus.path} = '#layanan'`).returning({ id: menus.id });
  if (migrated.length) log("menu PUBLIC Layanan (#layanan) diarahkan ke /medan");
  await db.update(menus).set({ path: "/medan" }).where(sql`${menus.scope} = 'PUBLIC' and ${menus.path} = '/jasa'`); // rute lama /jasa → /medan
  const [hasJasa] = await db.select({ id: menus.id }).from(menus).where(sql`${menus.scope} = 'PUBLIC' and ${menus.path} = '/medan'`).limit(1);
  if (!hasJasa) {
    await db.update(menus).set({ sortOrder: sql`${menus.sortOrder} + 1` }).where(sql`${menus.scope} = 'PUBLIC' and ${menus.sortOrder} >= 6`);
    await db.insert(menus).values({ scope: "PUBLIC", label: "Jasa", path: "/medan", icon: "Globe", sortOrder: 6 });
    log("menu PUBLIC Jasa ditambahkan");
  }
}


/**
 * Langganan pelanggan Adzkia (akun adzkia@adzkia.com) — data awal yang diminta pemilik 27 Okt 2026.
 * Hanya dibuat bila akun ada dan belum punya order sama sekali; setelah itu dikelola dari Admin > Order.
 */
async function seedAdzkiaSubscriptions(db: Db, log: (m: string) => void) {
  const [cust] = await db.select({ id: users.id }).from(users).where(eq(users.email, "adzkia@adzkia.com")).limit(1);
  if (!cust) return;
  const [cnt] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.userId, cust.id));
  if ((cnt?.n ?? 0) > 0) return;
  const pk = Object.fromEntries((await db.select({ id: servicePackages.id, slug: servicePackages.slug, name: servicePackages.name, price: servicePackages.price }).from(servicePackages)).map((p) => [p.slug, p]));
  const domainPk = pk["sewa-domain"], serverPk = pk["sewa-server-maintenance"];
  if (!domainPk || !serverPk) return;

  // 1) Sewa domain tahunan: sudah dibayar, berlaku 27 Sep 2026 – 27 Sep 2027 (sisa ±11 bulan)
  const [domOrder] = await db.insert(orders).values({
    number: "ORD-202609-0001", userId: cust.id, packageId: domainPk.id, packageName: domainPk.name, quantity: 2, status: "active",
    startDate: "2026-09-27", endDate: "2027-09-27", itemLabel: "domain", itemLimit: 2, items: ["adzkiasmart.com", "yayasanadzkiainternasional.com"],
    adminNote: "Perpanjangan tahunan untuk 2 domain. Sudah dibayar untuk periode 27 Sep 2026 – 27 Sep 2027.", createdAt: new Date("2026-09-27T09:00:00+07:00"),
  }).onConflictDoNothing({ target: orders.number }).returning({ id: orders.id });
  if (domOrder) {
    await db.insert(invoices).values({
      number: "INV-202609-0001", userId: cust.id, orderId: domOrder.id, title: "Sewa Domain ×2 (adzkiasmart.com, yayasanadzkiainternasional.com) — periode 2026/2027",
      period: "", amount: domainPk.price * 2, dueDate: "2026-09-27", status: "paid", paidAt: new Date("2026-09-27T10:00:00+07:00"), note: "Sudah dibayar.",
      createdAt: new Date("2026-09-27T09:05:00+07:00"),
    }).onConflictDoNothing({ target: invoices.number });
  }

  // 2) Server + maintenance jadi satu langganan: Rp 2.000.000 + Rp 2.500.000 per bulan, maks. 10 subdomain
  const subdomains = ["adzkiasmart.com", "adzset.yayasanadzkiainternasional.com", "am.yayasanadzkiainternasional.com", "digilib.yayasanadzkiainternasional.com", "grafo.yayasanadzkiainternasional.com", "roda.yayasanadzkiainternasional.com"];
  const [srvOrder] = await db.insert(orders).values({
    number: "ORD-202610-0001", userId: cust.id, packageId: serverPk.id, packageName: serverPk.name, quantity: 1, status: "active",
    startDate: "2026-10-01", unitPrice: 4_500_000, itemLabel: "subdomain", itemLimit: 10, items: subdomains,
    adminNote: "Biaya server Rp 2.000.000 + maintenance aplikasi Rp 2.500.000 per bulan untuk Adzkia Smart & Yayasan Adzkia Internasional. Mencakup maksimal 10 subdomain.",
    createdAt: new Date("2026-10-01T09:00:00+07:00"),
  }).onConflictDoNothing({ target: orders.number }).returning({ id: orders.id });
  if (srvOrder) {
    await db.insert(invoices).values({
      number: "INV-202610-0001", userId: cust.id, orderId: srvOrder.id, title: "Sewa Server + Maintenance Aplikasi — Oktober 2026 (Adzkia Smart & Yayasan Adzkia)",
      period: "2026-10", amount: 4_500_000, dueDate: "2026-11-05", status: "unpaid", note: "Server Rp 2.000.000 + maintenance Rp 2.500.000. Bayar via QRIS lalu unggah bukti.",
      createdAt: new Date("2026-10-01T09:05:00+07:00"),
    }).onConflictDoNothing({ target: invoices.number });
  }
  log("langganan Adzkia dibuat");
}

/**
 * Koreksi data Adzkia 27 Okt 2026 (permintaan pemilik): tagihan dirinci per baris, keduanya dibayar 15 Okt 2026,
 * jadwal berikutnya 15 Nov 2026 (bulanan) dan 15 Okt 2027 (domain). Hanya jalan bila INV-202610-0001 belum punya rincian.
 */
async function fixAdzkiaOctober(db: Db, log: (m: string) => void) {
  const [inv] = await db.select({ id: invoices.id, userId: invoices.userId, orderId: invoices.orderId, items: invoices.items }).from(invoices).where(eq(invoices.number, "INV-202610-0001")).limit(1);
  if (!inv || inv.items.length > 0 || !inv.orderId) return;
  const paidAt = new Date("2026-10-15T10:00:00+07:00");
  const serverLines = [{ description: "Sewa Server (Adzkia Smart & Yayasan Adzkia Internasional)", amount: 2_000_000 }, { description: "Maintenance Aplikasi", amount: 2_500_000 }];
  await db.update(orders).set({ startDate: "2026-10-15", breakdown: serverLines, updatedAt: new Date() }).where(eq(orders.id, inv.orderId));
  await db.update(invoices).set({ title: "Sewa Server + Maintenance Aplikasi — Oktober 2026", items: serverLines, amount: 4_500_000, dueDate: "2026-10-15", status: "paid", paidAt, note: "Dibayar 15 Oktober 2026.", updatedAt: new Date() }).where(eq(invoices.id, inv.id));
  await db.insert(invoices).values({
    number: "INV-202611-0001", userId: inv.userId, orderId: inv.orderId, title: "Sewa Server + Maintenance Aplikasi — November 2026", period: "2026-11",
    amount: 4_500_000, items: serverLines, dueDate: "2026-11-15", status: "unpaid", note: "Tagihan bulanan. Bayar via QRIS lalu unggah bukti.",
  }).onConflictDoNothing({ target: invoices.number });

  const [dom] = await db.select({ id: invoices.id, orderId: invoices.orderId, amount: invoices.amount }).from(invoices).where(eq(invoices.number, "INV-202609-0001")).limit(1);
  if (dom?.orderId) {
    const per = Math.round(dom.amount / 2);
    const domLines = [{ description: "Sewa Domain — adzkiasmart.com (1 tahun)", amount: per }, { description: "Sewa Domain — yayasanadzkiainternasional.com (1 tahun)", amount: dom.amount - per }];
    await db.update(orders).set({ startDate: "2026-10-15", endDate: "2027-10-15", adminNote: "Perpanjangan tahunan 2 domain. Dibayar 15 Okt 2026; tagihan berikutnya 15 Okt 2027.", updatedAt: new Date() }).where(eq(orders.id, dom.orderId));
    await db.update(invoices).set({ title: "Sewa Domain ×2 — periode 15 Okt 2026 s.d. 15 Okt 2027", items: domLines, dueDate: "2026-10-15", status: "paid", paidAt, note: "Dibayar 15 Oktober 2026. Perpanjangan berikutnya 15 Oktober 2027.", updatedAt: new Date() }).where(eq(invoices.id, dom.id));
  }
  log("data Adzkia dikoreksi: rincian tagihan, dibayar 15 Okt 2026, tagihan Nov 2026 dibuat (jatuh tempo 15 Nov), domain s.d. 15 Okt 2027");
}

/**
 * 30 Okt 2026 (permintaan pemilik): tagihan Deploy Website Absensi lunas 29 Okt 2026 11:00 WIB, dan order
 * "CRM Auto Chat" Bimbel Adzkia Kedinasan Medan (total Rp 15 jt) dengan tagihan DP Rp 5 jt belum lunas (sisa Rp 10 jt).
 * Tidak menimpa data yang sudah diubah admin: absensi hanya bila masih belum dibayar, CRM hanya bila belum ada.
 */
async function adzkiaCrmAndAbsensi(db: Db, log: (m: string) => void) {
  const [cust] = await db.select({ id: users.id }).from(users).where(eq(users.email, "adzkia@adzkia.com")).limit(1);
  if (!cust) return;
  const paid = await db.update(invoices).set({ status: "paid", paidAt: new Date("2026-10-29T11:00:00+07:00"), note: "Dibayar 29 Oktober 2026 pukul 11.00 WIB.", updatedAt: new Date() })
    .where(and(eq(invoices.number, "INV-202610-0002"), eq(invoices.userId, cust.id), eq(invoices.status, "unpaid"))).returning({ id: invoices.id });
  if (paid.length) log("INV-202610-0002 (Deploy Website Absensi) ditandai lunas 29 Okt 2026 11:00 WIB");

  const [has] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.userId, cust.id), sql`${orders.packageName} ilike '%CRM%'`)).limit(1);
  if (has) return;
  const [ord] = await db.insert(orders).values({
    number: "ORD-202610-0003", userId: cust.id, packageName: "Sistem CRM (Bot/AI) + Broadcast", quantity: 1, status: "active",
    startDate: "2026-10-30", unitPrice: 15_000_000,
    adminNote: "Sekali bayar Rp 15.000.000: DP Rp 5.000.000, sisa Rp 10.000.000 dibayar kemudian.",
  }).onConflictDoNothing({ target: orders.number }).returning({ id: orders.id });
  if (!ord) return;
  await db.insert(invoices).values({
    number: "INV-202610-0003", userId: cust.id, orderId: ord.id, title: "DP (panjar) Sistem CRM (Bot/AI) + Broadcast",
    period: "", amount: 5_000_000, items: [{ description: "DP Sistem CRM (Bot/AI) + Broadcast (sisa Rp 10.000.000)", amount: 5_000_000 }], dueDate: "2026-11-05", status: "unpaid",
    note: "DP Rp 5.000.000 dari total Rp 15.000.000; sisa Rp 10.000.000. Bayar via QRIS lalu unggah bukti.",
  }).onConflictDoNothing({ target: invoices.number });
  log("order CRM Auto Chat + tagihan DP Rp 5 jt dibuat");
}

/**
 * 30 Okt 2026 (permintaan pemilik): deployment server + 5 subdomain Yayasan Adzkia, sekali bayar Rp 2.550.000
 * (Rp 510.000 per subdomain), sudah dibayar 16 Okt 2026. Jam bayar tidak disebut; dipakai 12.00 WIB. Hanya dibuat bila belum ada.
 */
async function adzkiaSubdomainDeploy(db: Db, log: (m: string) => void) {
  const [cust] = await db.select({ id: users.id }).from(users).where(eq(users.email, "adzkia@adzkia.com")).limit(1);
  if (!cust) return;
  const name = "Deployment Server + Subdomain";
  const [has] = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.userId, cust.id), eq(orders.number, "ORD-202610-0004"))).limit(1);
  if (has) return;
  const subs = ["adzset", "am", "digilib", "grafo", "roda"].map((s) => `${s}.yayasanadzkiainternasional.com`);
  const lines = subs.map((d) => ({ description: `Deployment server + subdomain ${d}`, amount: 510_000 }));
  const paidAt = new Date("2026-10-16T12:00:00+07:00");
  const [ord] = await db.insert(orders).values({
    number: "ORD-202610-0004", userId: cust.id, packageName: name, quantity: 1, status: "active", startDate: "2026-10-16",
    itemLabel: "subdomain", items: subs, breakdown: lines,
    adminNote: "Sekali bayar (bukan bulanan) Rp 2.550.000 untuk 5 subdomain, Rp 510.000 per subdomain.", createdAt: paidAt,
  }).onConflictDoNothing({ target: orders.number }).returning({ id: orders.id });
  if (!ord) return;
  await db.insert(invoices).values({
    number: "INV-202610-0004", userId: cust.id, orderId: ord.id, title: "Deployment Server + Subdomain",
    period: "", amount: 2_550_000, items: lines, dueDate: "2026-10-16", status: "paid", paidAt, note: "Sekali bayar. Dibayar 16 Oktober 2026.", createdAt: paidAt,
  }).onConflictDoNothing({ target: invoices.number });
  log("order deployment server + 5 subdomain dibuat (sudah bayar 16 Okt 2026)");
}

/**
 * 30 Okt 2026: tujuan tagihan per order/invoice (satu akun, banyak tujuan) + bahasa layanan yang netral
 * ("Layanan Server & Aplikasi", bukan "Maintenance"). Adzkia Smart untuk server/domain/absensi/subdomain; CRM untuk Bimbel Adzkia Kedinasan.
 * Hanya mengisi bill_to yang masih kosong; ganti teks hanya bila masih memuat kata lama.
 */
async function adzkiaBillToAndWording(db: Db, log: (m: string) => void) {
  const [cust] = await db.select({ id: users.id }).from(users).where(eq(users.email, "adzkia@adzkia.com")).limit(1);
  if (!cust) return;
  const smart = sql`case when ${orders.packageName} ilike '%CRM%' then 'Bimbel Adzkia Kedinasan' else 'Adzkia Smart' end`;
  await db.update(orders).set({ billTo: smart }).where(and(eq(orders.userId, cust.id), eq(orders.billTo, "")));
  await db.execute(sql`update invoices i set bill_to = o.bill_to from orders o where i.order_id = o.id and i.user_id = ${cust.id} and i.bill_to = ''`);
  const rep = (col: ReturnType<typeof sql.raw>) => sql`replace(replace(replace(${col}, 'Sewa Server + Maintenance Aplikasi', 'Layanan Server & Aplikasi'), 'Maintenance Aplikasi', 'Layanan Aplikasi'), 'maintenance aplikasi', 'layanan aplikasi')`;
  await db.execute(sql`update orders set package_name = ${rep(sql.raw("package_name"))}, admin_note = ${rep(sql.raw("admin_note"))}, breakdown = ${rep(sql.raw("breakdown::text"))}::jsonb where user_id = ${cust.id} and (package_name ilike '%maintenance%' or admin_note ilike '%maintenance%' or breakdown::text ilike '%maintenance%')`);
  await db.execute(sql`update invoices set title = ${rep(sql.raw("title"))}, note = ${rep(sql.raw("note"))}, items = ${rep(sql.raw("items::text"))}::jsonb where user_id = ${cust.id} and (title ilike '%maintenance%' or note ilike '%maintenance%' or items::text ilike '%maintenance%')`);
  await db.execute(sql`update service_packages set name = 'Layanan Server & Aplikasi' where slug = 'sewa-server-maintenance' and name = 'Sewa Server + Maintenance Aplikasi'`);
  log("tujuan tagihan (bill_to) Adzkia diisi, teks layanan dinetralkan");
}

/** 30 Okt 2026: nama jasa CRM diperbaiki menjadi "Sistem CRM (Bot/AI) + Broadcast" (nama lama memuat "CRM Auto Chat"). */
async function renameCrm(db: Db, log: (m: string) => void) {
  const rep = (col: string) => sql.raw(`replace(replace(${col}, 'CRM Auto Chat — Bimbel Adzkia Kedinasan Medan', 'Sistem CRM (Bot/AI) + Broadcast'), 'CRM Auto Chat', 'Sistem CRM (Bot/AI) + Broadcast')`);
  await db.execute(sql`update orders set package_name = ${rep("package_name")}, admin_note = ${rep("admin_note")} where package_name like '%CRM Auto Chat%'`);
  await db.execute(sql`update invoices set title = ${rep("title")}, note = ${rep("note")}, items = ${rep("items::text")}::jsonb where title like '%CRM Auto Chat%' or items::text like '%CRM Auto Chat%'`);
  log("nama jasa CRM diperbarui");
}

/**
 * 30 Okt 2026: nama jasa deployment dipendekkan jadi "Deployment Server + Subdomain" (absensi & 5 subdomain), daftar subdomain
 * tampil di bawahnya tanpa limit; subdomain absensi juga masuk cakupan langganan Layanan Server & Aplikasi.
 */
async function tidyDeployOrders(db: Db, log: (m: string) => void) {
  const abs = "absensi.yayasanadzkiainternasional.com";
  const n = "Deployment Server + Subdomain";
  await db.execute(sql`update orders set package_name = ${n}, item_label = 'subdomain', item_limit = null, items = ${JSON.stringify([abs])}::jsonb where number = 'ORD-202610-0002' and package_name <> ${n}`);
  await db.execute(sql`update invoices set title = ${n} where number in ('INV-202610-0002','INV-202610-0004') and title <> ${n}`);
  await db.execute(sql`update orders set package_name = ${n}, item_limit = null where number = 'ORD-202610-0004' and package_name <> ${n}`);
  await db.execute(sql`update orders set items = items || ${JSON.stringify([abs])}::jsonb where number = 'ORD-202610-0001' and not (items ? ${abs})`);
  log("nama jasa deployment dirapikan, absensi masuk cakupan Layanan Server & Aplikasi");
}


/**
 * Penyederhanaan katalog 27 Okt 2026 (permintaan pemilik: "sedikit tapi padat"): paket yang belum pernah diubah admin
 * (updated_at = created_at) dan bukan paket inti dinonaktifkan; paket aplikasi custom disamakan dengan seed.
 * Admin bisa mengaktifkan kembali kapan saja — baris yang sudah disentuh admin tidak diubah.
 */
async function simplifyPackages(db: Db, log: (m: string) => void) {
  const hide = ["konsultasi-teknis", "landing-page-admin", "aplikasi-ml-dss", "mentoring-tugas-akhir", "maintenance-support"];
  const off = await db.update(servicePackages).set({ isActive: false, updatedAt: new Date() })
    .where(and(inArray(servicePackages.slug, hide), eq(servicePackages.isActive, true), sql`${servicePackages.updatedAt} = ${servicePackages.createdAt}`))
    .returning({ slug: servicePackages.slug });
  if (off.length) log(`paket dinonaktifkan (katalog disederhanakan): ${off.map((o) => o.slug).join(", ")}`);
  const custom = PACKAGES.find((x) => x.slug === "pembuatan-aplikasi-web")!;
  const upd = await db.update(servicePackages).set({ name: custom.name, description: custom.description, features: custom.features, updatedAt: new Date() })
    .where(sql`${servicePackages.slug} = 'pembuatan-aplikasi-web' and ${servicePackages.name} = 'Pembuatan Aplikasi Web Custom'`).returning({ id: servicePackages.id });
  if (upd.length) log("paket aplikasi custom diperbarui (beli putus / + sewa server)");
}
