import type { Metadata } from "next";
import { ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import { SERVICE_BRAND, ServiceFooter, ServiceHeader } from "@/components/service-shell";
import { getCurrentUser } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { waLink } from "@/shared/url";
import { PackageTabs, type PkgGroup } from "./package-tabs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Leetcloud · Jasa Pembuatan Aplikasi, Sewa Server & WhatsApp Gateway" },
  description: "Leetcloud melayani bisnis di seluruh Indonesia: aplikasi custom (beli putus atau plus sewa server), layanan server & aplikasi, WhatsApp gateway, dan domain.",
};

/** Kategori paket: urutan tab dan judulnya. */
const CATS = [
  { cat: "Sewa", key: "server", title: "Server & WhatsApp" },
  { cat: "Pembuatan Aplikasi", key: "aplikasi", title: "Aplikasi Custom" },
  { cat: "Katalog Sistem Putus", key: "katalog", title: "Katalog Sistem" },
];

const STEPS = [
  ["Ceritakan kebutuhan", "Lewat WhatsApp, gratis."],
  ["Sepakati harga & jadwal", "Penawaran tertulis yang jelas."],
  ["Pakai & bayar di dashboard", "Tagihan dan QRIS dalam satu tempat."],
] as const;

const FAQ = [
  ["Apa bedanya beli putus dan langganan?", "Beli putus: sekali bayar, kode aplikasi menjadi milik Anda. Langganan: biaya bulanan yang sudah termasuk server dan perawatan, tanpa biaya besar di awal."],
  ["Berapa harga pastinya?", "Harga di halaman ini adalah estimasi. Harga pasti kami berikan setelah diskusi singkat lewat WhatsApp, dalam bentuk penawaran tertulis."],
  ["Bagaimana cara membayar?", "Lewat dashboard pelanggan: pilih tagihan, bayar dengan QRIS atau transfer bank, lalu unggah bukti pembayaran."],
  ["Apakah bisa bertemu langsung?", "Bisa, untuk area Medan karena kami berdomisili di sana. Selebihnya semua dikerjakan online, jadi lokasi Anda tidak masalah."],
] as const;

/** Tiga proyek contoh (urut tampil). */
const SHOWCASE = ["villa-berastagi-mas", "manajemen-aset-pembayaran-asrama", "bimbel-adzkia"];

function Title({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="font-cyber text-xl font-bold uppercase text-[var(--ink)] md:text-2xl">{children}</h2>
      <span className="mx-auto mt-3 block h-[3px] w-12 rounded-full bg-[linear-gradient(90deg,var(--brand),var(--accent))]" />
      {sub && <p className="mx-auto mt-2 max-w-xl text-[var(--ink-3)]">{sub}</p>}
    </div>
  );
}

/** Halaman Leetcloud versi simpel: hero → paket → proyek → cara kerja → FAQ → kontak. */
export default async function LeetcloudPage() {
  const [{ profile: p, packages, projects }, user] = await Promise.all([getPortfolio(), getCurrentUser()]);
  const brand = SERVICE_BRAND;
  const wa = p?.phone ? waLink(p.phone, `Halo ${brand.name}, saya ingin konsultasi kebutuhan aplikasi/server.`) : null;
  const showPrices = p?.showServicePrices ?? false;

  const known = new Set(CATS.map((c) => c.cat));
  const groups: PkgGroup[] = [
    ...CATS,
    ...[...new Set(packages.map((s) => s.category))].filter((c) => !known.has(c)).map((c) => ({ cat: c, key: c.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: c })),
  ]
    .map(({ cat, ...g }) => ({
      ...g,
      items: packages.filter((s) => s.category === cat).map((s) => ({
        id: s.id, slug: s.slug, name: s.name, description: s.description, priceTiers: s.priceTiers,
        price: s.price, billingCycle: s.billingCycle, unit: s.unit, isFeatured: s.isFeatured,
      })),
    }))
    .filter((g) => g.items.length > 0);

  const showcase = SHOWCASE.map((slug) => projects.find((x) => x.slug === slug)).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div className="svc pb-20 md:pb-0">
      <ServiceHeader brand={brand} user={user} />

      <main>
        {/* ── Hero ── */}
        <section className="hero-galaxy px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <h1 className="font-cyber mx-auto max-w-3xl text-[1.8rem] font-bold uppercase leading-[1.2] text-[#fff] md:text-5xl md:leading-[1.15]">
            Aplikasi & server untuk <span className="text-[#00f0ff]">bisnis</span> <span className="text-[#ff5ce1]">Anda</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[#c7d2f0] md:text-lg">
            Website, sistem informasi, dan WhatsApp gateway. Dibuat sesuai kebutuhan, dikelola sampai jalan. Melayani seluruh Indonesia secara online.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-neon"><MessageCircle className="h-4 w-4" /> Konsultasi gratis</a>}
            <a href="#paket" className="btn-outline-neon">Lihat paket</a>
          </div>
        </section>

        {/* ── Paket ── */}
        <section id="paket" className="scroll-mt-20 bg-[var(--surface)] px-4 py-14 md:py-20">
          <div className="mx-auto max-w-5xl">
            <Title sub="Harga estimasi. Harga pasti setelah diskusi singkat.">Paket</Title>
            <PackageTabs groups={groups} showPrices={showPrices} />
          </div>
        </section>

        {/* ── Proyek ── */}
        {showcase.length > 0 && (
          <section id="proyek" className="scroll-mt-20 px-4 py-14 md:py-20">
            <div className="mx-auto max-w-5xl">
              <Title>Proyek kami</Title>
              <div className="grid gap-4 md:grid-cols-3">
                {showcase.map((x) => (
                  <article key={x.id} className="card flex flex-col p-5">
                    <h3 className="font-bold leading-snug text-[var(--ink)]">{x.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-3)]">{x.description}</p>
                    <span className="flex-1" />
                    {x.demoUrl && <a href={x.demoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-ink)] hover:underline">Lihat situs <ExternalLink className="h-3.5 w-3.5" /></a>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Cara kerja ── */}
        <section className="bg-[var(--surface)] px-4 py-14 md:py-20">
          <div className="mx-auto max-w-5xl">
            <Title>Cara kerja</Title>
            <ol className="grid gap-6 text-center md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t}>
                  <span className="font-cyber mx-auto grid h-11 w-11 place-items-center rounded-full border border-[var(--brand)] font-bold text-[var(--brand-ink)]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 font-bold text-[var(--ink)]">{t}</h3>
                  <p className="mt-1 text-sm text-[var(--ink-3)]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="scroll-mt-20 px-4 py-14 md:py-20">
          <div className="mx-auto max-w-2xl">
            <Title>Tanya jawab</Title>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group">
                  <summary className="flex items-center justify-between gap-4 py-4 font-semibold text-[var(--ink)]">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-3)] transition group-open:rotate-180" />
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-[var(--ink-2)]">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Kontak ── */}
        <section id="kontak" className="scroll-mt-20 bg-[var(--surface)] px-4 py-14 text-center md:py-20">
          <h2 className="font-cyber text-xl font-bold uppercase text-[var(--ink)] md:text-2xl">Diskusi dulu, <span className="text-neon-m">gratis</span></h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--ink-3)]">Ceritakan kebutuhan Anda langsung ke {brand.owner}, dibalas dalam 24 jam.</p>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary mt-6"><MessageCircle className="h-4 w-4" /> Chat dengan {brand.owner}</a>}
        </section>
      </main>

      <ServiceFooter brand={brand} />

      {/* Tombol WhatsApp menempel di bawah layar HP */}
      {wa && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] p-3 md:hidden" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-primary w-full"><MessageCircle className="h-4 w-4" /> Konsultasi gratis</a>
        </div>
      )}
    </div>
  );
}
