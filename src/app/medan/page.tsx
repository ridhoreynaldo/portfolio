import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, ExternalLink, Headset, MapPin, MessageCircle, Package, Phone, Server } from "lucide-react";
import { PriceTierTable, SERVICE_BRAND, ServiceFooter, ServiceHeader } from "@/components/service-shell";
import { getCurrentUser } from "@/modules/auth/session";
import { CYCLE, fmtIDR, tierRange } from "@/modules/billing/labels";
import { getPortfolio } from "@/modules/portfolio/service";
import { waLink } from "@/shared/url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Leetcloud · Jasa Pembuatan Aplikasi, Sewa Server & WhatsApp Gateway di Medan" },
  description: "Leetcloud melayani bisnis di Medan dan seluruh Indonesia: aplikasi custom (beli putus atau plus sewa server), sewa server + maintenance, WhatsApp gateway, dan domain.",
};

/** Tiga langkah saja: cukup untuk tahu apa yang terjadi setelah menghubungi. */
const STEPS = [
  ["Ceritakan kebutuhan", "Lewat WhatsApp. Diskusi awal gratis, kami bantu pilih paket yang pas."],
  ["Sepakati harga & jadwal", "Penawaran tertulis yang jelas. Pengerjaan mulai setelah Anda setuju."],
  ["Pakai & bayar lewat dashboard", "Langganan, tagihan, dan pembayaran QRIS tercatat di dashboard pelanggan. Garansi perbaikan setelah serah terima."],
] as const;

/** Tiga sorotan di hero. */
const HIGHLIGHTS = [
  [Code2, "Aplikasi custom", "Beli putus (kode milik Anda) atau sekaligus dihosting di server terkelola."],
  [Server, "Server & maintenance", "Cloud server, SSL, backup harian, monitoring, perbaikan bug — satu langganan."],
  [MessageCircle, "WhatsApp gateway", "API notifikasi & OTP dengan dashboard log; biaya mengikuti volume pesan."],
] as const;

/** Dua model untuk pembuatan aplikasi: beli putus saja, atau beli putus + sewa server. */
const APP_MODELS = [
  { title: "Beli putus", sub: "sekali bayar · tanpa hosting", points: ["Kode & aplikasi sepenuhnya milik Anda", "Dipasang di server Anda sendiri", "Garansi bug 30 hari"] },
  { title: "Beli putus + Sewa server", sub: "sekali bayar · lalu bulanan", points: ["Aplikasi jalan di cloud server terkelola", "Maintenance, backup, SSL & monitoring", "Biaya bulanan mengikuti jumlah pengguna"] },
] as const;

/** Proyek yang ditampilkan sebagai contoh karya (urut tampil). */
const SHOWCASE = ["siakad-universitas-quality", "manajemen-aset-pembayaran-asrama", "bimbel-adzkia", "wa-gateway", "dss-ahp-smart", "ml-kmeans-clustering-produk", "devops-infra"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Section({ id, eyebrow, title, sub, children, narrow }: { id: string; eyebrow: string; title: string; sub?: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <section id={id} className={`mx-auto scroll-mt-24 px-5 py-16 ${narrow ? "max-w-4xl" : "max-w-6xl"}`}>
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-serif mt-3 text-3xl font-semibold text-[var(--navy)] md:text-4xl">{title}</h2>
        {sub && <p className="mt-3 text-[var(--ink-2)]">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

/** Halaman brand jasa (tema terang klasik), dibuat ringkas: hero → paket → cara kerja → kontak. */
export default async function JasaPage() {
  const [{ profile: p, packages, projects }, user] = await Promise.all([getPortfolio(), getCurrentUser()]);
  const brand = SERVICE_BRAND;
  const showcase = SHOWCASE.map((slug) => projects.find((x) => x.slug === slug)).filter((x): x is NonNullable<typeof x> => !!x);
  const wa = p?.phone ? waLink(p.phone) : null;
  const showPrices = p?.showServicePrices ?? false;
  const waAsk = (pkgName: string) => (p?.phone ? waLink(p.phone, `Halo ${brand.name}, saya tertarik dengan paket "${pkgName}". Boleh minta penawaran harganya?`) : null);
  // urutan tampil: Pembuatan Aplikasi dulu, lalu Sewa, sisanya mengikuti
  const ORDER = ["Pembuatan Aplikasi", "Sewa"];
  const groups = Object.entries(packages.reduce<Record<string, typeof packages>>((acc, s) => ((acc[s.category] ??= []).push(s), acc), {}))
    .sort(([a], [b]) => (ORDER.indexOf(a) === -1 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) === -1 ? 99 : ORDER.indexOf(b)));
  const GROUP_SUB: Record<string, string> = {
    "Pembuatan Aplikasi": "Satu paket, scope mengikuti kebutuhan Anda: sistem informasi, dashboard, API, integrasi WhatsApp/pembayaran, sampai machine learning.",
    Sewa: "Langganan bulanan atau tahunan. Biaya mengikuti skala pemakaian; harga pasti dikonfirmasi lewat WhatsApp.",
  };

  return (
    <div className="svc">
      <ServiceHeader brand={brand} user={user} />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(900px_380px_at_20%_-10%,rgba(184,146,58,0.16),transparent_60%),radial-gradient(700px_320px_at_90%_10%,rgba(20,33,61,0.10),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
            <div>
              <p className="eyebrow inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Melayani Medan & seluruh Indonesia</p>
              <h1 className="font-serif mt-4 text-4xl font-semibold leading-[1.1] text-[var(--navy)] md:text-6xl">
                {brand.name}
                <span className="block text-2xl font-medium text-[var(--ink-2)] md:text-3xl">{brand.tagline}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-2)]">
                Aplikasi dibuat sesuai kebutuhan, bisa beli putus atau sekaligus disewakan servernya. Tatap muka untuk wilayah Medan dan sekitarnya, pengerjaan jarak jauh untuk seluruh Indonesia.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" /> Konsultasi Gratis via WhatsApp</a>}
                <a href="#paket" className="btn-ghost"><Package className="h-4 w-4" /> Lihat Paket</a>
              </div>
              <ul className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--rule)] pt-6 text-sm">
                {[["Respons", "< 24 jam"], ["Pembayaran", "QRIS & transfer"], ["Garansi", "Perbaikan bug"]].map(([k, v]) => (
                  <li key={k}><p className="font-serif text-lg font-semibold text-[var(--navy)]">{v}</p><p className="text-xs text-[var(--ink-3)]">{k}</p></li>
                ))}
              </ul>
            </div>

            {/* Ringkasan layanan: pengganti panel akun */}
            <aside className="card relative overflow-hidden p-7 md:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(184,146,58,0.22),transparent_70%)]" />
              <p className="eyebrow">Yang Anda dapatkan</p>
              <ul className="mt-5 divide-y divide-[var(--rule)]">
                {HIGHLIGHTS.map(([Icon, t, d]) => (
                  <li key={t} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="font-serif text-base font-semibold text-[var(--navy)]">{t}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-[var(--ink-2)]">{d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-[var(--navy)] px-4 py-3 text-sm text-white">
                <span>Harga pasti dikonfirmasi lewat WhatsApp</span>
                <a href="#paket" className="shrink-0 font-semibold text-[var(--gold-2)] hover:underline">Lihat paket →</a>
              </div>
            </aside>
          </div>
        </section>

        {/* ── Paket ── */}
        <div className="border-y border-[var(--rule)] bg-white/70">
          <Section id="paket" eyebrow="Pilih yang Anda butuhkan" title="Paket Layanan" sub="Sedikit pilihan, tapi jelas. Belum ada yang pas? Ceritakan saja kebutuhannya lewat WhatsApp.">
            {groups.length === 0 && <p className="card p-8 text-center text-[var(--ink-3)]">Belum ada paket layanan yang aktif.</p>}
            {groups.map(([cat, list], gi) => (
              <div key={cat} id={`paket-${slugify(cat)}`} className={`scroll-mt-24 ${gi ? "mt-14" : ""}`}>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h3 className="font-serif flex items-center gap-3 text-2xl font-semibold text-[var(--navy)]"><span className="ornament text-xs">◆</span>{cat === "Sewa" ? "Sewa & Langganan" : cat}</h3>
                    {GROUP_SUB[cat] && <p className="mt-1 max-w-2xl text-sm text-[var(--ink-2)]">{GROUP_SUB[cat]}</p>}
                  </div>
                </div>

                {cat === "Pembuatan Aplikasi" ? (
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                    {list.slice(0, 1).map((s) => (
                      <article key={s.id} className="card card-featured flex flex-col p-7">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><Code2 className="h-5 w-5" /></span>
                          <h4 className="font-serif text-xl font-semibold text-[var(--navy)]">{s.name}</h4>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{s.description}</p>
                        {s.features.length > 0 && <ul className="mt-4 grid gap-2 text-sm text-[var(--ink-2)] sm:grid-cols-2">{s.features.map((f) => <li key={f} className="check">{f}</li>)}</ul>}
                        <div className="mt-auto border-t border-[var(--rule)] pt-5">
                          <p className="font-serif text-lg font-semibold text-[var(--navy)]">{showPrices && s.price > 0 ? `mulai ${fmtIDR(s.price)}` : "Harga mengikuti scope"}</p>
                          <p className="text-xs text-[var(--ink-3)]">penawaran tertulis sebelum pengerjaan</p>
                          {waAsk(s.name) ? (
                            <a href={waAsk(s.name)!} target="_blank" rel="noreferrer" className="btn-gold btn-sm mt-4 w-full"><MessageCircle className="h-3.5 w-3.5" /> Diskusikan via WhatsApp</a>
                          ) : (
                            <Link href={`/medan/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Pesan <ArrowRight className="h-3.5 w-3.5" /></Link>
                          )}
                          <Link href={`/medan/order/${s.slug}`} className="mt-3 block text-center text-xs text-[var(--ink-3)] hover:text-[var(--navy)] hover:underline">atau pesan lewat dashboard</Link>
                        </div>
                      </article>
                    ))}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                      {APP_MODELS.map((m) => (
                        <div key={m.title} className="card p-6">
                          <p className="font-serif text-lg font-semibold text-[var(--navy)]">{m.title}</p>
                          <p className="text-xs uppercase tracking-wider text-[var(--ink-3)]">{m.sub}</p>
                          <ul className="mt-3 space-y-1.5 text-sm text-[var(--ink-2)]">{m.points.map((pt) => <li key={pt} className="check">{pt}</li>)}</ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((s) => (
                      <article key={s.id} className={`card flex flex-col p-6 ${s.isFeatured ? "card-featured" : ""}`}>
                        {s.isFeatured && <span className="tag tag-gold mb-3 self-start">Paling diminati</span>}
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><Server className="h-5 w-5" /></span>
                          <h4 className="font-serif text-lg font-semibold text-[var(--navy)]">{s.name}</h4>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{s.description}</p>
                        {s.features.length > 0 && <ul className="mt-4 space-y-2 text-sm text-[var(--ink-2)]">{s.features.map((f) => <li key={f} className="check">{f}</li>)}</ul>}
                        <div className="mt-auto border-t border-[var(--rule)] pt-5">
                          {s.priceTiers.length > 0 ? (
                            <>
                              <p className="font-serif text-xl font-semibold text-[var(--navy)]">{tierRange(s.priceTiers)}</p>
                              <p className="mb-3 text-xs text-[var(--ink-3)]">{CYCLE[s.billingCycle]}{s.unit && ` / ${s.unit}`} · tergantung skala pemakaian</p>
                              <PriceTierTable tiers={s.priceTiers} cycle={CYCLE[s.billingCycle]} unit={s.unit} compact />
                            </>
                          ) : showPrices && s.price > 0 ? (
                            <>
                              <p className="font-serif text-2xl font-semibold text-[var(--navy)]">{fmtIDR(s.price)}</p>
                              <p className="text-xs text-[var(--ink-3)]">{CYCLE[s.billingCycle]}{s.unit && ` / ${s.unit}`}</p>
                            </>
                          ) : (
                            <>
                              <p className="font-serif text-lg font-semibold text-[var(--navy)]">Harga menyesuaikan kebutuhan</p>
                              <p className="text-xs text-[var(--ink-3)]">{CYCLE[s.billingCycle]}{s.unit && ` / ${s.unit}`} · penawaran via WhatsApp</p>
                            </>
                          )}
                          {waAsk(s.name) ? (
                            <a href={waAsk(s.name)!} target="_blank" rel="noreferrer" className={`${s.isFeatured ? "btn-gold" : "btn-primary"} btn-sm mt-4 w-full`}><MessageCircle className="h-3.5 w-3.5" /> {s.priceTiers.length ? "Tanya harga pasti" : "Hubungi via WhatsApp"}</a>
                          ) : (
                            <Link href={`/medan/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Sewa paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                          )}
                          <Link href={`/medan/order/${s.slug}`} className="mt-3 block text-center text-xs text-[var(--ink-3)] hover:text-[var(--navy)] hover:underline">atau sewa lewat dashboard</Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </Section>
        </div>

        {showcase.length > 0 && (
          <Section id="proyek" eyebrow="Contoh pekerjaan" title="Proyek yang Pernah Dikerjakan" sub="Sebagian karya: sistem informasi, integrasi WhatsApp, analisis data, sampai infrastruktur server.">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((x) => (
                <article key={x.id} className="card flex flex-col p-6">
                  <h3 className="font-serif text-lg font-semibold text-[var(--navy)]">{x.title}</h3>
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-[var(--ink-2)]">{x.description}</p>
                  {x.techStack.length > 0 && <ul className="mt-4 flex flex-wrap gap-1.5">{x.techStack.slice(0, 6).map((t) => <li key={t} className="tag">{t}</li>)}</ul>}
                  {x.demoUrl && <a href={x.demoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--navy)] hover:underline">Lihat situs <ExternalLink className="h-3 w-3" /></a>}
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* ── Cara kerja ── */}
        <div className="border-y border-[var(--rule)] bg-white/70">
          <Section id="cara-kerja" eyebrow="Prosesnya sederhana" title="Cara Kerja" narrow>
            <ol className="grid gap-6 md:grid-cols-3">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="card p-6">
                  <span className="font-serif text-4xl font-semibold text-[var(--gold-2)]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif mt-2 text-lg font-semibold text-[var(--navy)]">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{d}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        {/* ── Kontak ── */}
        <Section id="kontak" eyebrow="Mari berdiskusi" title="Masih ragu? Konsultasi dulu, gratis." sub="Ceritakan kebutuhan Anda. Kami bantu tentukan paket dan estimasi yang paling masuk akal." narrow>
          <div className="card flex flex-col items-center gap-4 p-8 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--navy)] text-white"><Headset className="h-6 w-6" /></span>
              <div>
                <p className="font-serif text-lg font-semibold text-[var(--navy)]">{brand.name}</p>
                <p className="text-sm text-[var(--ink-3)]">{brand.area}, Sumatera Utara · balas dalam 24 jam</p>
              </div>
            </div>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><Phone className="h-4 w-4" /> Chat WhatsApp</a>}
          </div>
        </Section>
      </main>

      <ServiceFooter brand={brand} />
    </div>
  );
}
