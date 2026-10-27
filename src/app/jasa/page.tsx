import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Code2, ExternalLink, GraduationCap, Headset, LayoutDashboard, Mail, MessageCircle, MessagesSquare, Phone, QrCode, Server, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { PORTFOLIO_URL, PriceTierTable, ServiceFooter, ServiceHeader, serviceBrandOf } from "@/components/service-shell";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { CYCLE, fmtIDR, tierRange } from "@/modules/billing/labels";
import { getPaymentSettings } from "@/modules/billing/repository";
import { getPortfolio } from "@/modules/portfolio/service";
import { waLink } from "@/shared/url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolio();
  const b = serviceBrandOf(profile);
  return {
    title: { absolute: `${b.name} · Jasa Pembuatan Aplikasi, Sewa Server & Konsultasi IT` },
    description: `${b.name}: ${b.tagline}. Konsultasi teknis, pembuatan aplikasi (web, API, machine learning), sewa server & WhatsApp gateway, maintenance, dan mentoring. Dikelola oleh ${b.owner}.`,
  };
}

const SERVICES = [
  { icon: MessagesSquare, title: "Konsultasi Teknis", desc: "Diskusi arsitektur, pemilihan teknologi, audit kode, dan rencana pengembangan sistem Anda." },
  { icon: Code2, title: "Pembuatan Aplikasi", desc: "Aplikasi web, REST API, sistem informasi, dashboard, dan integrasi, dibangun rapi dan siap dikembangkan." },
  { icon: BrainCircuit, title: "Machine Learning & DSS", desc: "Model prediksi, sistem pendukung keputusan, dan analitik data yang benar-benar terpakai." },
  { icon: Server, title: "Sewa Server & WA Gateway", desc: "Server terkelola dengan SSL dan backup, plus API WhatsApp untuk notifikasi dan OTP aplikasi Anda." },
  { icon: Wrench, title: "Maintenance & Support", desc: "Perbaikan bug, pembaruan keamanan, pemantauan, dan dukungan prioritas setiap bulan." },
  { icon: GraduationCap, title: "Mentoring Tugas Akhir", desc: "Bimbingan skripsi/tugas akhir bidang informatika, algoritma, dan machine learning." },
];

const STEPS = [
  ["Konsultasi gratis", "Ceritakan kebutuhan Anda lewat WhatsApp atau form pesanan. Tidak ada biaya untuk diskusi awal."],
  ["Penawaran & kesepakatan", "Saya susun scope, jadwal, dan harga final yang jelas. Pengerjaan dimulai setelah Anda setuju."],
  ["Pengerjaan transparan", "Progres dilaporkan berkala. Revisi sesuai kesepakatan sampai hasilnya siap dipakai."],
  ["Serah terima & dukungan", "Tagihan tampil di portal pelanggan, bayar via QRIS atau transfer. Garansi perbaikan setelah serah terima."],
] as const;

const FAQ = [
  ["Apakah harga paket sudah final?", "Harga paket adalah harga dasar. Untuk pembuatan aplikasi, harga final mengikuti scope yang kita sepakati bersama sebelum pengerjaan dimulai."],
  ["Bagaimana skema pembayarannya?", "Jasa sekali bayar: uang muka saat mulai, pelunasan saat serah terima. Sewa dan maintenance: tagihan bulanan otomatis muncul di portal pelanggan."],
  ["Bagaimana cara membayar?", "Scan QRIS atau transfer bank, lalu unggah bukti pembayaran di halaman tagihan. Setelah diverifikasi, status tagihan berubah menjadi lunas."],
  ["Apakah ada garansi?", "Ya. Perbaikan bug untuk fitur yang sudah disepakati gratis selama masa garansi, dan bisa dilanjutkan dengan paket maintenance bulanan."],
  ["Apakah saya perlu akun untuk memesan?", "Ya, akun pelanggan gratis. Dengan akun, Anda bisa memantau pesanan, melihat tagihan, dan mengunggah bukti pembayaran kapan saja."],
] as const;

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

/** Halaman brand jasa (tema terang klasik): layanan, cara kerja, paket & harga, pembayaran, FAQ, kontak, dan masuk portal. */
export default async function JasaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ profile: p, packages }, user, pay, { next }] = await Promise.all([getPortfolio(), getCurrentUser(), getPaymentSettings(), searchParams]);
  const brand = serviceBrandOf(p);
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const wa = p?.phone ? waLink(p.phone) : null;
  const showPrices = p?.showServicePrices ?? false;
  const waAsk = (pkgName: string) => (p?.phone ? waLink(p.phone, `Halo, saya tertarik dengan paket "${pkgName}" di ${brand.name}. Boleh minta penawaran harganya?`) : null);
  const faq = showPrices ? FAQ : [["Berapa biayanya?", "Harga menyesuaikan kebutuhan dan scope pekerjaan. Untuk sewa server dan WhatsApp gateway tersedia tabel estimasi berdasarkan jumlah pengguna dan volume pesan. Hubungi saya lewat WhatsApp, ceritakan kebutuhan Anda, dan saya kirim penawaran pasti sebelum pengerjaan dimulai."] as const, ...FAQ.slice(1)];
  const groups = Object.entries(packages.reduce<Record<string, typeof packages>>((acc, s) => ((acc[s.category] ??= []).push(s), acc), {}));
  const hasBank = !!(pay?.bankName && pay.bankAccount);
  const portalLabel = user && homeFor(user) === "/admin" ? "Panel Admin" : "Portal Pelanggan";

  return (
    <div className="svc">
      <ServiceHeader brand={brand} user={user} />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(900px_380px_at_20%_-10%,rgba(184,146,58,0.16),transparent_60%),radial-gradient(700px_320px_at_90%_10%,rgba(20,33,61,0.10),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pb-24 md:pt-20">
            <div>
              <p className="eyebrow">Jasa pembuatan aplikasi & layanan IT</p>
              <h1 className="font-serif mt-4 text-4xl font-semibold leading-[1.1] text-[var(--navy)] md:text-6xl">
                {brand.name}
                <span className="block text-2xl font-medium text-[var(--ink-2)] md:text-3xl">{brand.tagline}</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--ink-2)]">
                Dari ide sampai sistem yang berjalan: konsultasi, pembuatan aplikasi, server, dan perawatan, ditangani langsung oleh <Link href={PORTFOLIO_URL} className="inline-flex items-center gap-1 font-semibold text-[var(--navy)] underline decoration-[var(--gold)] decoration-2 underline-offset-4 hover:text-[var(--gold-2)]" title="Lihat portofolio, pengalaman & sertifikasi">{brand.owner} <ExternalLink className="h-3.5 w-3.5" /></Link>.
                {showPrices ? "Harga jelas, progres transparan, pembayaran mudah lewat portal." : "Penawaran menyesuaikan kebutuhan, progres transparan, pembayaran mudah lewat portal."}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {showPrices ? (
                  <>
                    <a href="#paket" className="btn-primary">Lihat Paket & Harga <ArrowRight className="h-4 w-4" /></a>
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost"><MessageCircle className="h-4 w-4" /> Konsultasi Gratis</a>}
                  </>
                ) : (
                  <>
                    {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><MessageCircle className="h-4 w-4" /> Hubungi via WhatsApp</a>}
                    <Link href={PORTFOLIO_URL} className="btn-ghost" title="Siapa di balik Kodeva: pengalaman, sertifikasi & proyek"><UserRound className="h-4 w-4" /> Profil & Portofolio</Link>
                    <a href="#paket" className="btn-ghost">Lihat Paket <ArrowRight className="h-4 w-4" /></a>
                  </>
                )}
              </div>
              <ul className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--rule)] pt-6 text-sm">
                {[["Respons", "< 24 jam"], ["Pembayaran", "QRIS & transfer"], ["Garansi", "Perbaikan bug"]].map(([k, v]) => (
                  <li key={k}><p className="font-serif text-lg font-semibold text-[var(--navy)]">{v}</p><p className="text-xs text-[var(--ink-3)]">{k}</p></li>
                ))}
              </ul>
            </div>

            {/* Panel masuk / portal */}
            <aside id="masuk" className="card h-fit scroll-mt-24 p-7 md:p-8">
              {user ? (
                <>
                  <p className="eyebrow">{portalLabel === "Panel Admin" ? "Masuk sebagai admin" : "Akun pelanggan"}</p>
                  <h2 className="font-serif mt-2 text-2xl font-semibold text-[var(--navy)]">Halo, {user.name}</h2>
                  <p className="mt-2 text-sm text-[var(--ink-2)]">Anda sudah masuk. Kelola pesanan, tagihan, dan pembayaran dari {portalLabel.toLowerCase()}.</p>
                  <Link href={homeFor(user)} className="btn-primary mt-6 w-full"><LayoutDashboard className="h-4 w-4" /> Buka {portalLabel}</Link>
                  <a href="#paket" className="btn-ghost mt-2 w-full">Pesan paket baru</a>
                </>
              ) : (
                <>
                  <p className="eyebrow">Login {brand.name}</p>
                  <h2 className="font-serif mt-2 text-2xl font-semibold text-[var(--navy)]">Masuk ke akun</h2>
                  <p className="mb-6 mt-2 text-sm text-[var(--ink-2)]">Pelanggan: pantau pesanan, lihat tagihan, dan bayar via QRIS. Admin: kelola paket, order, dan tagihan.</p>
                  <LoginForm next={safeNext} />
                  <p className="mt-5 text-center text-sm text-[var(--ink-3)]">
                    Belum punya akun? <Link href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : "/register"} className="font-semibold text-[var(--navy)] hover:underline">Daftar gratis</Link>
                  </p>
                </>
              )}
            </aside>
          </div>
        </section>

        {/* ── Layanan ── */}
        <div className="border-y border-[var(--rule)] bg-white/70">
          <Section id="layanan" eyebrow="Apa yang bisa saya kerjakan" title="Layanan" sub="Satu tempat untuk kebutuhan software Anda, dari konsultasi awal hingga sistem berjalan dan terawat.">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <article key={s.title} className="card p-6 transition hover:-translate-y-0.5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><s.icon className="h-5 w-5" /></span>
                  <h3 className="font-serif mt-4 text-lg font-semibold text-[var(--navy)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{s.desc}</p>
                </article>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Cara kerja ── */}
        <Section id="cara-kerja" eyebrow="Prosesnya sederhana" title="Cara Kerja" sub="Empat langkah dari pertama kali menghubungi sampai sistem Anda berjalan.">
          <ol className="grid gap-6 md:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="relative">
                <span className="font-serif text-5xl font-semibold text-[var(--gold-2)]">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif mt-2 text-lg font-semibold text-[var(--navy)]">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{d}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Paket & harga ── */}
        <div className="border-y border-[var(--rule)] bg-white/70">
          <Section id="paket" eyebrow={showPrices ? "Transparan sejak awal" : "Menyesuaikan kebutuhan Anda"} title={showPrices ? "Paket & Harga" : "Paket Layanan"} sub={showPrices ? "Pilih paket yang paling mendekati kebutuhan Anda. Belum ada yang pas? Mulai dari konsultasi, atau hubungi saya langsung." : "Pilih paket yang paling mendekati kebutuhan Anda, lalu hubungi saya via WhatsApp untuk penawaran harga. Belum ada yang pas? Ceritakan saja kebutuhannya."}>
            {groups.length === 0 && <p className="card p-8 text-center text-[var(--ink-3)]">Belum ada paket layanan yang aktif.</p>}
            {groups.map(([cat, list], gi) => (
              <div key={cat} id={`paket-${slugify(cat)}`} className={`scroll-mt-24 ${gi ? "mt-12" : ""}`}>
                <h3 className="font-serif mb-5 flex items-center gap-3 text-xl font-semibold text-[var(--navy)]"><span className="ornament text-xs">◆</span>{cat}</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <article key={s.id} className={`card flex flex-col p-6 ${s.isFeatured ? "card-featured" : ""}`}>
                      {s.isFeatured && <span className="tag tag-gold mb-3 self-start">Paling diminati</span>}
                      <h4 className="font-serif text-lg font-semibold text-[var(--navy)]">{s.name}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--ink-2)]">{s.description}</p>
                      {s.features.length > 0 && (
                        <ul className="mt-4 space-y-2 text-sm text-[var(--ink-2)]">{s.features.map((f) => <li key={f} className="check">{f}</li>)}</ul>
                      )}
                      <div className="mt-auto border-t border-[var(--rule)] pt-5">
                        {s.priceTiers.length > 0 ? (
                          <>
                            <p className="font-serif text-xl font-semibold text-[var(--navy)]">{tierRange(s.priceTiers)}</p>
                            <p className="mb-3 text-xs text-[var(--ink-3)]">{CYCLE[s.billingCycle]}{s.unit && ` / ${s.unit}`} · tergantung skala pemakaian</p>
                            <PriceTierTable tiers={s.priceTiers} cycle={CYCLE[s.billingCycle]} unit={s.unit} compact />
                            {waAsk(s.name) ? (
                              <a href={waAsk(s.name)!} target="_blank" rel="noreferrer" className={`${s.isFeatured ? "btn-gold" : "btn-primary"} btn-sm mt-4 w-full`}><MessageCircle className="h-3.5 w-3.5" /> Tanya harga pasti via WhatsApp</a>
                            ) : (
                              <Link href={`/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Pesan paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                            )}
                            <Link href={`/order/${s.slug}`} className="mt-3 block text-center text-xs text-[var(--ink-3)] hover:text-[var(--navy)] hover:underline">atau pesan lewat portal</Link>
                          </>
                        ) : showPrices ? (
                          <>
                            <p className="font-serif text-2xl font-semibold text-[var(--navy)]">{s.price > 0 ? fmtIDR(s.price) : "Hubungi"}</p>
                            <p className="text-xs text-[var(--ink-3)]">{s.price > 0 ? CYCLE[s.billingCycle] : "harga mengikuti scope"}{s.unit && ` / ${s.unit}`}</p>
                            <Link href={`/order/${s.slug}`} className={`${s.isFeatured ? "btn-gold" : "btn-primary"} btn-sm mt-4 w-full`}>Pesan paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                          </>
                        ) : (
                          <>
                            <p className="font-serif text-lg font-semibold text-[var(--navy)]">Harga menyesuaikan kebutuhan</p>
                            <p className="text-xs text-[var(--ink-3)]">{CYCLE[s.billingCycle]}{s.unit && ` / ${s.unit}`} · penawaran via WhatsApp</p>
                            {waAsk(s.name) ? (
                              <a href={waAsk(s.name)!} target="_blank" rel="noreferrer" className={`${s.isFeatured ? "btn-gold" : "btn-primary"} btn-sm mt-4 w-full`}><MessageCircle className="h-3.5 w-3.5" /> Hubungi via WhatsApp</a>
                            ) : (
                              <Link href={`/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Pesan paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                            )}
                            <Link href={`/order/${s.slug}`} className="mt-3 block text-center text-xs text-[var(--ink-3)] hover:text-[var(--navy)] hover:underline">atau pesan lewat portal</Link>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </Section>
        </div>

        {/* ── Pembayaran & portal ── */}
        <Section id="pembayaran" eyebrow="Mudah dan tercatat" title="Pembayaran & Portal Pelanggan" narrow>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><QrCode className="h-5 w-5" /></span><h3 className="font-serif text-lg font-semibold text-[var(--navy)]">Metode pembayaran</h3></div>
              <ul className="mt-4 space-y-2 text-sm text-[var(--ink-2)]">
                <li className="check">QRIS (semua e-wallet & mobile banking)</li>
                <li className="check">{hasBank ? `Transfer ${pay!.bankName} ${pay!.bankAccount}${pay!.bankHolder ? ` a.n. ${pay!.bankHolder}` : ""}` : "Transfer bank (detail tampil di tagihan)"}</li>
                <li className="check">Unggah bukti bayar di halaman tagihan, verifikasi maksimal 1×24 jam</li>
              </ul>
              {pay?.instructions && <p className="mt-3 whitespace-pre-line text-xs text-[var(--ink-3)]">{pay.instructions}</p>}
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><ShieldCheck className="h-5 w-5" /></span><h3 className="font-serif text-lg font-semibold text-[var(--navy)]">Yang Anda dapatkan di portal</h3></div>
              <ul className="mt-4 space-y-2 text-sm text-[var(--ink-2)]">
                <li className="check">Riwayat & status pesanan</li>
                <li className="check">Tagihan bulanan sewa/maintenance otomatis</li>
                <li className="check">Bayar & unggah bukti, status diperbarui otomatis</li>
                <li className="check">Profil & data penagihan</li>
              </ul>
              <Link href={user ? homeFor(user) : "#masuk"} className="btn-ghost btn-sm mt-5">{user ? `Buka ${portalLabel}` : "Masuk / daftar"} <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </Section>

        {/* ── FAQ ── */}
        <div className="border-y border-[var(--rule)] bg-white/70">
          <Section id="faq" eyebrow="Sebelum memesan" title="Pertanyaan Umum" narrow>
            <div className="card divide-y divide-[var(--rule)]">
              {faq.map(([q, a]) => (
                <details key={q} className="group p-5">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-[var(--navy)]">
                    {q}<span className="text-[var(--gold)] transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">{a}</p>
                </details>
              ))}
            </div>
          </Section>
        </div>

        {/* ── Kontak ── */}
        <Section id="kontak" eyebrow="Mari berdiskusi" title="Masih ragu? Konsultasi dulu, gratis." sub="Ceritakan kebutuhan Anda. Saya bantu tentukan paket dan estimasi yang paling masuk akal." narrow>
          <div className="card flex flex-col items-center gap-4 p-8 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--navy)] text-white"><Headset className="h-6 w-6" /></span>
              <div>
                <Link href={PORTFOLIO_URL} className="font-serif inline-flex items-center gap-1.5 text-lg font-semibold text-[var(--navy)] underline decoration-[var(--gold)] decoration-2 underline-offset-4 hover:text-[var(--gold-2)]" title="Lihat portofolio">{brand.owner} <ExternalLink className="h-4 w-4" /></Link>
                <p className="text-sm text-[var(--ink-3)]">{p?.location || "Indonesia"} · balas dalam 24 jam · <Link href={PORTFOLIO_URL} className="underline underline-offset-2 hover:text-[var(--navy)]">lihat pengalaman & sertifikasi</Link></p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><Phone className="h-4 w-4" /> WhatsApp</a>}
              <Link href={PORTFOLIO_URL} className="btn-ghost"><UserRound className="h-4 w-4" /> Portofolio</Link>
              {p?.email && <a href={`mailto:${p.email}`} className="btn-ghost"><Mail className="h-4 w-4" /> Email</a>}
            </div>
          </div>
        </Section>
      </main>

      <ServiceFooter brand={brand} />
    </div>
  );
}
