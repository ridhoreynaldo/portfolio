import type { Metadata } from "next";
import { ArrowRight, Check, ChevronDown, Code2, ExternalLink, MapPin, MessageCircle, Server, Smartphone } from "lucide-react";
import { SERVICE_BRAND, ServiceFooter, ServiceHeader } from "@/components/service-shell";
import { getCurrentUser } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { waLink } from "@/shared/url";
import { PackageTabs, type PkgGroup } from "./package-tabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Leetcloud · Jasa Pembuatan Aplikasi, Sewa Server & WhatsApp Gateway di Medan" },
  description: "Leetcloud melayani bisnis di Medan dan seluruh Indonesia: aplikasi custom (beli putus atau plus sewa server), layanan server & aplikasi, WhatsApp gateway, dan domain.",
};

/** Kategori paket: urutan tab, judul, keterangan, dan kartu layanan di atasnya. */
const CATS: { cat: string; key: string; title: string; sub: string; icon: typeof Server; blurb: string }[] = [
  { cat: "Sewa", key: "server", title: "Server & WhatsApp", icon: Server,
    blurb: "Cloud server, SSL, backup harian, pemantauan, perawatan aplikasi, dan WhatsApp gateway dalam satu langganan.",
    sub: "Langganan bulanan; biaya mengikuti jumlah pengguna dan volume pesan. Harga pasti dikonfirmasi lewat WhatsApp." },
  { cat: "Pembuatan Aplikasi", key: "aplikasi", title: "Aplikasi Custom", icon: Code2,
    blurb: "Aplikasi web sesuai kebutuhan: beli putus (kode milik Anda) atau langganan bulanan tanpa biaya besar di awal.",
    sub: "Dua cara memiliki aplikasi: beli putus (sekali bayar) atau langganan bulanan (SaaS) tanpa biaya besar di awal." },
  { cat: "Katalog Sistem Putus", key: "katalog", title: "Katalog Sistem", icon: Smartphone,
    blurb: "Sistem siap pakai untuk skripsi, penelitian, dan operasional: SPK, machine learning, deep learning, kriptografi.",
    sub: "Sistem siap pakai dengan studi kasus seperti di jurnal (mis. penilaian kinerja dan seleksi karyawan). Beli putus; harga adalah estimasi." },
];

const STEPS = [
  ["Ceritakan kebutuhan", "Lewat WhatsApp. Diskusi awal gratis, kami bantu pilih paket yang pas."],
  ["Sepakati harga & jadwal", "Penawaran tertulis yang jelas. Pengerjaan mulai setelah Anda setuju."],
  ["Pakai & bayar lewat dashboard", "Langganan, tagihan, dan pembayaran QRIS tercatat di dashboard. Garansi perbaikan setelah serah terima."],
] as const;

const FAQ = [
  ["Apa bedanya beli putus dan langganan?", "Beli putus: sekali bayar, kode aplikasi menjadi milik Anda. Langganan: biaya bulanan yang sudah termasuk server dan perawatan, tanpa biaya besar di awal."],
  ["Berapa harga pastinya?", "Harga di halaman ini adalah estimasi per tingkat pemakaian. Harga pasti kami berikan setelah diskusi singkat lewat WhatsApp, dalam bentuk penawaran tertulis."],
  ["Bagaimana cara membayar?", "Lewat dashboard pelanggan: pilih tagihan, bayar dengan QRIS atau transfer bank, lalu unggah bukti pembayaran."],
  ["Apakah bisa bertemu langsung?", "Bisa, untuk wilayah Medan dan sekitarnya. Untuk luar daerah, pengerjaan dilakukan jarak jauh ke seluruh Indonesia."],
  ["Apakah ada garansi?", "Ada. Setelah serah terima, perbaikan bug tetap kami tangani sesuai kesepakatan."],
] as const;

/** Proyek yang ditampilkan sebagai contoh karya (urut tampil). */
const SHOWCASE = ["villa-berastagi-mas", "manajemen-aset-pembayaran-asrama", "siakad-universitas-quality", "bimbel-adzkia", "wa-gateway", "devops-infra"];

function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={`mb-8 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--ink)] md:text-[2rem] md:leading-tight">{title}</h2>
      {sub && <p className="mt-2 text-[var(--ink-2)]">{sub}</p>}
    </div>
  );
}

/** Halaman Leetcloud: hero → layanan → paket (tab) → proyek → cara kerja → FAQ → ajakan kontak. */
export default async function LeetcloudPage() {
  const [{ profile: p, packages, projects }, user] = await Promise.all([getPortfolio(), getCurrentUser()]);
  const brand = SERVICE_BRAND;
  const wa = p?.phone ? waLink(p.phone, `Halo ${brand.name}, saya ingin konsultasi kebutuhan aplikasi/server.`) : null;
  const showPrices = p?.showServicePrices ?? false;

  const known = new Set(CATS.map((c) => c.cat));
  const groups: PkgGroup[] = [
    ...CATS.map((c) => ({ key: c.key, title: c.title, sub: c.sub, cat: c.cat })),
    ...[...new Set(packages.map((s) => s.category))].filter((c) => !known.has(c)).map((c) => ({ key: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: c, sub: undefined, cat: c })),
  ]
    .map(({ cat, ...g }) => ({
      ...g,
      items: packages.filter((s) => s.category === cat).map((s) => ({
        id: s.id, slug: s.slug, name: s.name, description: s.description, features: s.features, priceTiers: s.priceTiers,
        price: s.price, billingCycle: s.billingCycle, unit: s.unit, isFeatured: s.isFeatured,
        wa: p?.phone ? waLink(p.phone, `Halo ${brand.name}, saya tertarik dengan paket "${s.name}". Boleh minta penawaran harganya?`) : null,
      })),
    }))
    .filter((g) => g.items.length > 0);
  const liveKeys = new Set(groups.map((g) => g.key));

  const showcase = SHOWCASE.map((slug) => projects.find((x) => x.slug === slug)).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div className="svc pb-20 md:pb-0">
      <ServiceHeader brand={brand} user={user} />

      <main>
        {/* ── Hero ── */}
        <section className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-6 md:py-20">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]"><MapPin className="h-3.5 w-3.5" /> Medan & seluruh Indonesia</p>
              <h1 className="mt-4 text-[2rem] font-bold leading-[1.15] text-[var(--ink)] md:text-5xl md:leading-[1.1]">
                Aplikasi, server & WhatsApp gateway untuk bisnis Anda
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ink-2)] md:text-lg">
                Dibuat sesuai kebutuhan, bisa beli putus atau sekaligus dikelola di server kami. Cocok untuk villa, asrama, sekolah, bimbel, dan usaha lain.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" /> Konsultasi gratis</a>}
                <a href="#paket" className="btn-ghost">Lihat paket <ArrowRight className="h-4 w-4" /></a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--ink-2)]">
                {["Respons < 24 jam", "Bayar QRIS & transfer", "Garansi perbaikan bug"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[var(--brand-ink)]" /> {t}</li>
                ))}
              </ul>
            </div>

            {/* Pratinjau dashboard pelanggan (ilustrasi) */}
            <div aria-hidden className="card mx-auto w-full max-w-md bg-[var(--bg)] p-4 md:p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--ink)]">Dashboard pelanggan</p>
                <span className="pill pill-emerald">Aktif</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="card p-3"><p className="text-[11px] text-[var(--ink-3)]">Layanan aktif</p><p className="text-lg font-bold text-[var(--ink)]">3</p></div>
                <div className="card p-3"><p className="text-[11px] text-[var(--ink-3)]">Tagihan terbuka</p><p className="text-lg font-bold text-[var(--ink)]">1</p></div>
              </div>
              {[["Server & Aplikasi", "Sudah bayar", "pill-emerald"], ["WhatsApp Gateway", "Sudah bayar", "pill-emerald"], ["Domain .com", "7 hari lagi", "pill-amber"]].map(([n, s, c]) => (
                <div key={n} className="card mt-3 flex items-center gap-3 p-3">
                  <span className="icon-box !h-8 !w-8"><Server className="h-4 w-4" /></span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink)]">{n}</p>
                  <span className={`pill ${c}`}>{s}</span>
                </div>
              ))}
              <div className="btn-primary btn-sm mt-3 w-full">Bayar via QRIS</div>
            </div>
          </div>
        </section>

        {/* ── Layanan ── */}
        <section id="layanan" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
          <SectionHead eyebrow="Layanan" title="Apa yang bisa kami bantu" sub="Tiga kelompok layanan. Pilih salah satu untuk melihat paketnya." />
          <div className="grid gap-4 md:grid-cols-3">
            {CATS.map(({ key, title, icon: Icon, blurb }) => (
              <a key={key} href={liveKeys.has(key) ? `#paket-${key}` : "#paket"} className="card card-link group flex flex-col p-5">
                <span className="icon-box"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--ink-2)]">{blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-ink)]">Lihat paket <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </a>
            ))}
          </div>
        </section>

        {/* ── Paket ── */}
        <section className="border-y border-[var(--line)] bg-[var(--surface)]">
          <div id="paket" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
            <SectionHead eyebrow="Paket & harga" title="Pilih paket yang pas" sub="Harga di bawah adalah estimasi. Buka Detail untuk tabel harga lengkap, atau tanya harga pasti lewat WhatsApp." />
            <PackageTabs groups={groups} showPrices={showPrices} />
          </div>
        </section>

        {/* ── Proyek ── */}
        {showcase.length > 0 && (
          <section id="proyek" className="mx-auto max-w-6xl scroll-mt-24 py-14 md:px-6 md:py-20">
            <div className="px-4 md:px-0"><SectionHead eyebrow="Portofolio" title="Proyek yang sudah berjalan" sub="Sistem villa, asrama, kampus, bimbel, sampai WhatsApp gateway dan infrastruktur server." /></div>
            <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
              {showcase.map((x) => (
                <article key={x.id} className="card flex w-[82%] shrink-0 snap-start flex-col p-5 sm:w-[45%] md:w-auto">
                  {x.tags.includes("Langganan Bulanan") && <span className="tag mb-3 self-start">Langganan bulanan</span>}
                  <h3 className="font-bold leading-snug text-[var(--ink)]">{x.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--ink-2)]">{x.description}</p>
                  {x.techStack.length > 0 && <ul className="mt-4 flex flex-wrap gap-1.5">{x.techStack.slice(0, 4).map((t) => <li key={t} className="tag">{t}</li>)}</ul>}
                  {x.demoUrl && <a href={x.demoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-ink)] hover:underline">Lihat situs <ExternalLink className="h-3.5 w-3.5" /></a>}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── Cara kerja ── */}
        <section className="border-y border-[var(--line)] bg-[var(--surface)]">
          <div id="cara-kerja" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
            <SectionHead eyebrow="Prosesnya sederhana" title="Cara kerja" />
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="flex gap-4 md:flex-col md:gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">{t}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--ink-2)]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-14 md:px-6 md:py-20">
          <SectionHead eyebrow="Tanya jawab" title="Pertanyaan yang sering diajukan" center />
          <div className="card divide-y divide-[var(--line)]">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-4 md:px-5">
                <summary className="flex items-center justify-between gap-4 py-4 font-semibold text-[var(--ink)]">
                  {q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-3)] transition group-open:rotate-180" />
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-[var(--ink-2)]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Ajakan kontak ── */}
        <section id="kontak" className="scroll-mt-24 px-4 pb-14 md:px-6 md:pb-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 rounded-2xl bg-[var(--brand)] p-6 text-white md:flex-row md:items-center md:justify-between md:p-10">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Masih ragu? Diskusi dulu, gratis.</h2>
              <p className="mt-2 max-w-xl text-white/85">Ceritakan kebutuhan Anda. Kami bantu tentukan paket dan estimasi yang paling masuk akal. {brand.area}, Sumatera Utara · balas dalam 24 jam.</p>
            </div>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-2 rounded-[10px] bg-white px-5 font-semibold text-[#1f6b52] transition hover:bg-white/90"><MessageCircle className="h-4 w-4" /> Chat WhatsApp</a>}
          </div>
        </section>
      </main>

      <ServiceFooter brand={brand} wa={wa} />

      {/* Tombol WhatsApp menempel di bawah layar HP */}
      {wa && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] p-3 md:hidden" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-primary w-full"><MessageCircle className="h-4 w-4" /> Konsultasi gratis via WhatsApp</a>
        </div>
      )}
    </div>
  );
}
