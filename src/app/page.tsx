import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Briefcase, Cpu, FolderKanban, Globe, Handshake, Mail, Phone, Rocket, Satellite, Sparkles, UserRound } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { Starfield } from "@/components/starfield";
import { ProjectGrid } from "@/components/project-grid";
import { ExpIcon } from "@/components/exp-icon";
import { SERVICE_BRAND_FALLBACK, SERVICE_LOGO } from "@/components/service-shell";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/modules/auth/session";
import { getPortfolio } from "@/modules/portfolio/service";
import { safeUrl, waLink } from "@/shared/url";
import { fmtDate } from "@/shared/ui";

// Halaman dinamis, tetapi datanya dari cache bertag "portfolio" (dihitung ulang hanya saat konten berubah).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getPortfolio();
  const title = profile?.siteName || profile?.fullName || "Portfolio";
  const description = profile?.summary || profile?.headline || "Portofolio pribadi";
  return { title: { absolute: title }, description, openGraph: { title, description, type: "website" } };
}

function Section({ id, no, icon, title, accent, children, narrow, sub }: { id: string; no: string; icon: React.ReactNode; title: string; accent: string; children: React.ReactNode; narrow?: boolean; sub?: string }) {
  return (
    <section id={id} className={`relative mx-auto scroll-mt-28 px-5 py-16 ${narrow ? "max-w-4xl" : "max-w-6xl"}`}>
      <div className="mb-8">
        <p className="hud-label mb-2 flex items-center gap-2"><span className="text-magenta">[{no}]</span> // sektor</p>
        <div className="flex items-center gap-3">
          <span className="text-cyan-300">{icon}</span>
          <h2 className="font-display text-2xl font-bold tracking-wide md:text-3xl">
            {title} <span className="text-gradient">{accent}</span>
          </h2>
        </div>
        {sub && <p className="mt-2 max-w-2xl text-sm text-slate-400">{sub}</p>}
        <hr className="hr-glow mt-5" />
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [{ profile: p, menus, experiences, certifications, skills, projects, packages }, user] = await Promise.all([getPortfolio(), getCurrentUser()]);
  const show = (id: string) => menus.some((m) => m.path === `#${id}`);
  const name = p?.fullName || "Nama Anda";
  const brand = p?.siteName || name;
  const photo = safeUrl(p?.photoUrl), github = safeUrl(p?.github), linkedin = safeUrl(p?.linkedin), website = safeUrl(p?.website);
  const wa = p?.phone ? waLink(p.phone) : null;
  const featured = projects.filter((x) => x.isFeatured);
  const rest = projects.filter((x) => !x.isFeatured);
  const years = experiences.length ? new Date().getFullYear() - Math.min(...experiences.map((e) => Number(/\d{4}/.exec(e.startDate)?.[0] ?? new Date().getFullYear()))) : 0;

  const biodata = p
    ? ([
        ["Nama", p.fullName],
        ["Tempat, tanggal lahir", [p.birthPlace, p.birthDate ? fmtDate(p.birthDate, { day: "numeric", month: "long", year: "numeric" }) : ""].filter(Boolean).join(", ")],
        ["Jenis kelamin", p.gender],
        ["Kewarganegaraan", p.nationality],
        ["Agama", p.religion],
        ["Status", p.maritalStatus],
        ["Domisili", p.location],
        ["Email", p.email],
        ["Telepon", p.phone],
      ] as const).filter(([, v]) => v)
    : [];

  const skillGroups = Object.entries(skills.reduce<Record<string, typeof skills>>((acc, s) => ((acc[s.category] ??= []).push(s), acc), {}));
  const stats: [string, string][] = [
    ["Tahun pengalaman", years > 0 ? `${years}+` : "—"],
    ["Proyek", `${projects.length}`],
    ["Sertifikasi", `${certifications.length}`],
    ["Layanan", `${packages.length}`],
  ];

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <SiteHeader brand={brand} menus={menus} user={user} />

        <main id="top">
          {/* ── Hero ── */}
          <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-5 pb-16 pt-16 text-center md:flex-row md:text-left md:pt-24">
            {photo ? (
              <div className="hud shrink-0 p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt={name} className="h-44 w-44 object-cover md:h-56 md:w-56" />
              </div>
            ) : (
              <div className="hud grid h-44 w-44 shrink-0 place-items-center md:h-56 md:w-56">
                <Satellite className="h-16 w-16 text-cyan-300/60" />
              </div>
            )}
            <div className="min-w-0">
              <p className="hud-label mb-3 flex items-center justify-center gap-2 md:justify-start">
                <span className="pulse-dot" /> {p?.tagline || "online // siap menerima proyek"}
              </p>
              <h1 className="font-display max-w-3xl text-3xl font-black leading-tight tracking-wide md:text-5xl">
                <span className="glitch text-gradient" data-text={p?.headline || name}>{p?.headline || name}</span>
              </h1>
              {p?.summary && <p className="mt-5 max-w-2xl text-base text-slate-300/85 md:text-lg">{p.summary}</p>}
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                <Link href="/jasa" className="btn-primary">Jasa & Layanan <ArrowRight className="h-4 w-4" /></Link>
                {show("proyek") && <a href="#proyek" className="btn-ghost"><Rocket className="h-4 w-4" /> Lihat Proyek</a>}
                {github && <a href={github} target="_blank" rel="noreferrer" className="btn-ghost"><SiGithub className="h-4 w-4" /> GitHub</a>}
                {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="btn-ghost"><FaLinkedin className="h-4 w-4" /> LinkedIn</a>}
              </div>
              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map(([k, v]) => (
                  <div key={k} className="hud px-4 py-3 text-left">
                    <dd className="font-display text-2xl font-bold text-neon">{v}</dd>
                    <dt className="hud-label mt-1 !text-[9px] !opacity-60">{k}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          {show("tentang") && p?.about && (
            <Section id="tentang" no="01" icon={<UserRound className="h-6 w-6" />} title="Tentang" accent="Saya" narrow>
              <p className="hud whitespace-pre-line p-8 leading-relaxed text-slate-300">{p.about}</p>
            </Section>
          )}

          {show("biodata") && biodata.length > 0 && (
            <Section id="biodata" no="02" icon={<Cpu className="h-6 w-6" />} title="Bio" accent="data" narrow>
              <dl className="hud grid gap-x-8 gap-y-4 p-8 sm:grid-cols-2">
                {biodata.map(([k, v]) => (
                  <div key={k}>
                    <dt className="hud-label !text-[10px]">{k}</dt>
                    <dd className="text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {show("pengalaman") && experiences.length > 0 && (
            <Section id="pengalaman" no="03" icon={<Briefcase className="h-6 w-6" />} title="Pengalaman" accent="& Pendidikan" narrow>
              <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-cyan-400/70 before:via-fuchsia-500/40 before:to-transparent">
                {experiences.map((e) => (
                  <div key={e.id} className="relative pl-12">
                    <span className="absolute left-[7px] top-5 flex h-7 w-7 items-center justify-center border border-cyan-300 bg-[#070b1f] shadow-[0_0_14px_rgba(0,240,255,0.7)]" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }}>
                      <ExpIcon icon={e.icon} className="h-3 w-3 text-cyan-200" />
                    </span>
                    <article className="hud p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-white md:text-lg">{e.position}</h3>
                        {e.isCurrent && <span className="chip chip-lime">● saat ini</span>}
                      </div>
                      <p className="mt-1 text-sm font-medium text-cyan-300">{e.company}{e.location && <span className="text-slate-400"> · {e.location}</span>}</p>
                      <p className="hud-label mt-1 !text-[10px] !text-slate-500">{e.startDate} — {e.isCurrent ? "Sekarang" : e.endDate || "—"}</p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300/85">{e.description}</p>
                    </article>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {show("skill") && skills.length > 0 && (
            <Section id="skill" no="04" icon={<Sparkles className="h-6 w-6" />} title="Skill" accent="& Keahlian">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skillGroups.map(([cat, list]) => (
                  <div key={cat} className="hud p-5">
                    <h3 className="hud-label mb-4">{cat}</h3>
                    <ul className="space-y-3">
                      {list.map((s) => (
                        <li key={s.id}>
                          <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><span className="text-neon" style={{ fontFamily: "var(--font-mono)" }}>{s.level}%</span></div>
                          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, Math.max(0, s.level))}%` }} /></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {show("sertifikasi") && certifications.length > 0 && (
            <Section id="sertifikasi" no="05" icon={<Award className="h-6 w-6" />} title="Serti" accent="fikasi">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certifications.map((c) => {
                  const url = safeUrl(c.credentialUrl);
                  return (
                    <li key={c.id} className="hud p-5">
                      <h3 className="font-display text-sm font-bold text-white">{c.name}</h3>
                      <p className="mt-1 text-sm text-cyan-300">{c.issuer}</p>
                      <p className="hud-label mt-2 !text-[10px] !text-slate-500">Terbit {fmtDate(c.issueDate)}{c.expiryDate && ` · s/d ${fmtDate(c.expiryDate)}`}</p>
                      {url && <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-fuchsia-300 hover:underline">Lihat kredensial →</a>}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {show("proyek") && projects.length > 0 && (
            <Section id="proyek" no="06" icon={<Rocket className="h-6 w-6" />} title="Pro" accent="yek" sub="Sistem informasi akademik, manajemen aset & pembayaran, DSS & machine learning, gateway WhatsApp, dan infrastruktur.">
              {featured.length > 0 && (
                <>
                  <h3 className="hud-label mb-4 !text-fuchsia-300">★ unggulan</h3>
                  <ProjectGrid projects={featured} />
                </>
              )}
              {rest.length > 0 && (
                <>
                  <h3 className={`hud-label mb-4 ${featured.length ? "mt-10" : ""}`}><FolderKanban className="mr-1 inline h-4 w-4" /> semua proyek</h3>
                  <ProjectGrid projects={rest} />
                </>
              )}
            </Section>
          )}

          {/* Detail jasa & paket ada di halaman /jasa — di sini hanya ajakan singkat. */}
          <section id="layanan" className="mx-auto max-w-4xl scroll-mt-28 px-5 py-10">
            <div className="hud flex flex-col items-center justify-between gap-5 p-7 text-center md:flex-row md:text-left">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={SERVICE_LOGO} alt="" className="mt-0.5 hidden h-12 w-12 shrink-0 md:block" />
                <div>
                  <p className="hud-label mb-1"><span className="text-magenta">[{(p?.serviceBrand || SERVICE_BRAND_FALLBACK).toLowerCase()}]</span> // butuh bantuan teknis?</p>
                  <p className="font-display text-lg font-bold text-white"><span className="text-gradient">{p?.serviceBrand || SERVICE_BRAND_FALLBACK}</span> <Handshake className="mx-1 inline h-5 w-5 text-cyan-300" /> layanan jasa saya: konsultasi, pembuatan aplikasi, sewa server & WA gateway, maintenance, mentoring.</p>
                  <p className="mt-1 text-sm text-slate-400">Paket, harga, cara kerja, dan portal pelanggan ada di halaman {p?.serviceBrand || SERVICE_BRAND_FALLBACK}.</p>
                </div>
              </div>
              <Link href="/jasa" className="btn-primary shrink-0">Buka {p?.serviceBrand || SERVICE_BRAND_FALLBACK} <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </section>

          {show("kontak") && (
            <Section id="kontak" no="07" icon={<Mail className="h-6 w-6" />} title="Mari" accent="Terhubung" narrow>
              <div className="hud p-8 text-center">
                <p className="text-slate-300/80">Punya proyek, butuh konsultasi, atau ingin menyewa layanan? Saya senang mendengarnya.</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {p?.email && <a href={`mailto:${p.email}`} className="btn-primary"><Mail className="h-4 w-4" /> {p.email}</a>}
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost"><Phone className="h-4 w-4" /> {p?.phone}</a>}
                  {github && <a href={github} target="_blank" rel="noreferrer" className="btn-ghost"><SiGithub className="h-4 w-4" /> GitHub</a>}
                  {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="btn-ghost"><FaLinkedin className="h-4 w-4" /> LinkedIn</a>}
                  {website && <a href={website} target="_blank" rel="noreferrer" className="btn-ghost"><Globe className="h-4 w-4" /> Website</a>}
                  <Link href="/jasa" className="btn-magenta">Lihat Jasa</Link>
                </div>
              </div>
            </Section>
          )}
        </main>

        <SiteFooter name={name} />
      </div>
    </div>
  );
}
