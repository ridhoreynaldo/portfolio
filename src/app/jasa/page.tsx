import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Handshake, LayoutDashboard, LogIn, Mail, MessageCircle, Phone, QrCode, ShieldCheck, Wallet, Wrench } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { LoginForm } from "@/app/login/login-form";
import { getCurrentUser, homeFor } from "@/modules/auth/session";
import { CYCLE, fmtIDR } from "@/modules/billing/labels";
import { getPaymentSettings } from "@/modules/billing/repository";
import { getPortfolio } from "@/modules/portfolio/service";
import { waLink } from "@/shared/url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolio();
  const name = profile?.fullName || "Portfolio";
  return {
    title: "Jasa & Layanan",
    description: `Jasa konsultasi teknis, pembuatan aplikasi (web, API, machine learning/DSS), sewa server & WhatsApp gateway, maintenance, dan mentoring oleh ${name}.`,
  };
}

const STEPS = [
  { icon: Handshake, title: "Pilih & pesan", desc: "Daftar akun pelanggan (gratis), pilih paket, lalu tulis brief kebutuhan Anda." },
  { icon: ShieldCheck, title: "Konfirmasi scope", desc: "Saya hubungi Anda lewat WhatsApp/email untuk detail scope, jadwal, dan harga final." },
  { icon: Wrench, title: "Pengerjaan", desc: "Progres dilaporkan berkala. Revisi sesuai kesepakatan sampai siap pakai." },
  { icon: Wallet, title: "Bayar via portal", desc: "Tagihan (sekali atau bulanan) tampil di akun Anda: scan QRIS/transfer, unggah bukti, status otomatis diperbarui." },
];

const FAQ = [
  ["Apakah harga di sini final?", "Harga paket adalah harga dasar. Untuk pembuatan aplikasi, harga final mengikuti scope yang kita sepakati saat konfirmasi."],
  ["Bagaimana skema pembayaran?", "Jasa sekali bayar: DP saat mulai, pelunasan saat serah terima. Sewa & maintenance: tagihan bulanan otomatis muncul di portal pelanggan."],
  ["Bagaimana cara bayar?", "Scan QRIS atau transfer bank, lalu unggah bukti pembayaran di halaman tagihan. Setelah saya verifikasi, status tagihan berubah jadi lunas."],
  ["Apakah ada garansi?", "Ya. Perbaikan bug untuk fitur yang sudah disepakati gratis selama masa garansi, dan bisa dilanjutkan dengan paket maintenance bulanan."],
] as const;

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Section({ id, no, icon, title, accent, children, narrow, sub }: { id: string; no: string; icon: React.ReactNode; title: string; accent: string; children: React.ReactNode; narrow?: boolean; sub?: string }) {
  return (
    <section id={id} className={`relative mx-auto scroll-mt-28 px-5 py-14 ${narrow ? "max-w-4xl" : "max-w-6xl"}`}>
      <div className="mb-8">
        <p className="hud-label mb-2 flex items-center gap-2"><span className="text-magenta">[{no}]</span> // sektor</p>
        <div className="flex items-center gap-3">
          <span className="text-cyan-300">{icon}</span>
          <h2 className="font-display text-2xl font-bold tracking-wide md:text-3xl">{title} <span className="text-gradient">{accent}</span></h2>
        </div>
        {sub && <p className="mt-2 max-w-2xl text-sm text-slate-400">{sub}</p>}
        <hr className="hr-glow mt-5" />
      </div>
      {children}
    </section>
  );
}

const Bullet = ({ children }: { children: React.ReactNode }) => <li className="flex gap-2"><span className="text-cyan-300">▸</span><span>{children}</span></li>;

/** Halaman khusus jasa: info layanan lengkap, cara kerja, katalog paket, pembayaran, FAQ, dan akses portal (form login). */
export default async function JasaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ profile: p, menus, packages }, user, pay, { next }] = await Promise.all([getPortfolio(), getCurrentUser(), getPaymentSettings(), searchParams]);
  const brand = p?.siteName || p?.fullName || "Portfolio";
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "";
  const wa = p?.phone ? waLink(p.phone) : null;
  const groups = Object.entries(packages.reduce<Record<string, typeof packages>>((acc, s) => ((acc[s.category] ??= []).push(s), acc), {}));
  const hasBank = !!(pay?.bankName && pay.bankAccount);
  const portalHref = user ? homeFor(user) : "#masuk";
  const portalLabel = user && homeFor(user) === "/admin" ? "Panel Admin" : "Portal Pelanggan";

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <SiteHeader brand={brand} menus={menus} user={user} />

        <main>
          {/* ── Hero jasa + panel akses (login) ── */}
          <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-16 md:grid-cols-[1fr_360px] md:pt-24">
            <div className="min-w-0">
              <p className="hud-label mb-3 flex items-center gap-2"><span className="pulse-dot" /> <span className="text-magenta">[jasa]</span> // layanan profesional</p>
              <h1 className="font-display text-3xl font-black leading-tight tracking-wide md:text-5xl">
                Jasa & <span className="text-gradient">Layanan</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base text-slate-300/85 md:text-lg">
                Konsultasi teknis, pembuatan aplikasi apa pun (web, REST API, machine learning/DSS), sewa server & WhatsApp gateway, maintenance aplikasi, serta mentoring tugas akhir.
                Semua pesanan, tagihan, dan pembayaran dikelola lewat portal pelanggan.
              </p>
              {groups.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {groups.map(([c]) => <li key={c}><a href={`#paket-${slugify(c)}`} className="chip chip-magenta hover:brightness-125">{c}</a></li>)}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#paket" className="btn-primary">Lihat Paket <ArrowRight className="h-4 w-4" /></a>
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost"><MessageCircle className="h-4 w-4" /> Konsultasi via WhatsApp</a>}
                <Link href="/" className="btn-ghost">← Portofolio</Link>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-3">
                {[["Paket aktif", `${packages.length}`], ["Respons", "< 24 jam"], ["Pembayaran", "QRIS · Bank"]].map(([k, v]) => (
                  <div key={k} className="hud px-4 py-3">
                    <dd className="font-display text-lg font-bold text-neon md:text-2xl">{v}</dd>
                    <dt className="hud-label mt-1 !text-[9px] !opacity-60">{k}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <aside id="masuk" className="hud h-fit scroll-mt-28 p-6">
              <p className="hud-label">// access terminal</p>
              {user ? (
                <>
                  <h2 className="font-display mt-1 text-lg font-bold text-white">Halo, {user.name.split(" ")[0]}</h2>
                  <p className="mt-2 text-sm text-slate-400">Anda sudah masuk. Kelola pesanan, tagihan, dan pembayaran dari {portalLabel.toLowerCase()}.</p>
                  <Link href={homeFor(user)} className="btn-primary mt-5 w-full"><LayoutDashboard className="h-4 w-4" /> Buka {portalLabel}</Link>
                  <a href="#paket" className="btn-ghost mt-2 w-full">Pesan paket baru</a>
                </>
              ) : (
                <>
                  <h2 className="font-display mt-1 text-lg font-bold text-white"><LogIn className="mr-2 inline h-5 w-5 text-cyan-300" />Masuk Portal</h2>
                  <p className="mb-5 mt-2 text-xs text-slate-400">Pelanggan: pesan jasa, lihat tagihan, bayar via QRIS. Admin: panel pengelolaan.</p>
                  <LoginForm next={safeNext} />
                  <p className="mt-5 text-center text-xs text-slate-400">
                    Belum punya akun? <Link href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : "/register"} className="text-cyan-300 hover:underline">Daftar pelanggan (gratis)</Link>
                  </p>
                </>
              )}
            </aside>
          </section>

          <Section id="cara-kerja" no="01" icon={<Clock className="h-6 w-6" />} title="Cara" accent="Kerja">
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="hud p-5">
                  <p className="hud-label !text-fuchsia-300">langkah {i + 1}</p>
                  <div className="mt-2 flex items-center gap-2 font-display text-sm font-bold text-white"><s.icon className="h-5 w-5 text-cyan-300" />{s.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{s.desc}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="paket" no="02" icon={<Handshake className="h-6 w-6" />} title="Paket &" accent="Harga" sub="Pilih paket yang paling mendekati kebutuhan Anda. Jika belum ada yang cocok, pesan paket konsultasi atau hubungi saya langsung.">
            {groups.length === 0 && <p className="hud p-8 text-center text-slate-400">Belum ada paket layanan yang aktif.</p>}
            {groups.map(([cat, list], gi) => (
              <div key={cat} id={`paket-${slugify(cat)}`} className={`scroll-mt-28 ${gi ? "mt-12" : ""}`}>
                <h3 className="hud-label mb-4 !text-fuchsia-300">// {cat}</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <article key={s.id} className={`hud flex flex-col p-6 ${s.isFeatured ? "!border-fuchsia-400/50" : ""}`}>
                      {s.isFeatured && <span className="chip chip-magenta mb-3 self-start">★ populer</span>}
                      <h4 className="font-display text-base font-bold text-white">{s.name}</h4>
                      <p className="mt-2 text-sm text-slate-300/80">{s.description}</p>
                      {s.features.length > 0 && <ul className="mt-4 space-y-1.5 text-sm text-slate-300">{s.features.map((f) => <Bullet key={f}>{f}</Bullet>)}</ul>}
                      <div className="mt-auto pt-5">
                        <p className="font-display text-xl font-bold text-neon">{s.price > 0 ? fmtIDR(s.price) : "Hubungi"}</p>
                        <p className="hud-label !text-[10px] !text-slate-500">{s.price > 0 ? CYCLE[s.billingCycle] : "harga mengikuti scope"}{s.unit && ` / ${s.unit}`}</p>
                        <Link href={`/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Pesan paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </Section>

          <Section id="pembayaran" no="03" icon={<QrCode className="h-6 w-6" />} title="Pembayaran" accent="& Portal" narrow>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="hud p-6">
                <p className="font-display font-bold text-white"><QrCode className="mr-2 inline h-5 w-5 text-cyan-300" />Metode pembayaran</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <Bullet>QRIS (semua e-wallet & mobile banking)</Bullet>
                  {hasBank ? <Bullet>Transfer {pay!.bankName} {pay!.bankAccount}{pay!.bankHolder && ` a.n. ${pay!.bankHolder}`}</Bullet> : <Bullet>Transfer bank (detail tampil di tagihan)</Bullet>}
                  <Bullet>Unggah bukti bayar di halaman tagihan, verifikasi maksimal 1×24 jam</Bullet>
                </ul>
                {pay?.instructions && <p className="mt-3 whitespace-pre-line text-xs text-slate-500">{pay.instructions}</p>}
              </div>
              <div className="hud p-6">
                <p className="font-display font-bold text-white"><LayoutDashboard className="mr-2 inline h-5 w-5 text-cyan-300" />Portal pelanggan</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <Bullet>Riwayat & status pesanan</Bullet>
                  <Bullet>Tagihan bulanan sewa/maintenance otomatis</Bullet>
                  <Bullet>Bayar & unggah bukti, status diperbarui otomatis</Bullet>
                  <Bullet>Profil & data penagihan</Bullet>
                </ul>
                <Link href={portalHref} className="btn-ghost btn-sm mt-4">{user ? `Buka ${portalLabel}` : "Masuk / daftar"} <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </Section>

          <Section id="faq" no="04" icon={<BadgeCheck className="h-6 w-6" />} title="Pertanyaan" accent="Umum" narrow>
            <div className="hud divide-y divide-white/5">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group p-5">
                  <summary className="cursor-pointer list-none font-display text-sm font-bold text-white">
                    <span className="mr-2 inline-block text-cyan-300 transition group-open:rotate-90">▸</span>{q}
                  </summary>
                  <p className="mt-3 pl-5 text-sm leading-relaxed text-slate-400">{a}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="kontak" no="05" icon={<Mail className="h-6 w-6" />} title="Masih" accent="Ragu?" narrow>
            <div className="hud p-8 text-center">
              <p className="text-slate-300/80">Ceritakan kebutuhan Anda dulu, gratis. Saya bantu tentukan paket dan estimasi yang paling masuk akal.</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary"><Phone className="h-4 w-4" /> WhatsApp</a>}
                {p?.email && <a href={`mailto:${p.email}`} className="btn-ghost"><Mail className="h-4 w-4" /> {p.email}</a>}
                <a href="#paket" className="btn-magenta">Lihat Paket</a>
              </div>
            </div>
          </Section>
        </main>

        <SiteFooter name={p?.fullName || "Portfolio"} />
      </div>
    </div>
  );
}
