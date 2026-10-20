import type { Metadata } from "next";
import { ArrowRight, Award, Briefcase, FolderKanban, Globe, Mail, Phone, Rocket, Sparkles, UserRound } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { Starfield } from "@/components/starfield";
import { ProjectGrid } from "@/components/project-grid";
import { ExpIcon } from "@/components/exp-icon";
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

function Section({ id, icon, title, accent, children, narrow }: { id: string; icon: React.ReactNode; title: string; accent: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <section id={id} className={`mx-auto scroll-mt-24 px-5 py-16 ${narrow ? "max-w-4xl" : "max-w-6xl"}`}>
      <div className="mb-8 flex items-center gap-3">
        <span className="text-violet-300">{icon}</span>
        <h2 className="font-display text-3xl font-bold">
          {title} <span className="text-gradient">{accent}</span>
        </h2>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const { profile: p, menus, experiences, certifications, skills, projects } = await getPortfolio();
  const show = (id: string) => menus.some((m) => m.path === `#${id}`);
  const name = p?.fullName || "Nama Anda";
  const brand = p?.siteName || name;
  const photo = safeUrl(p?.photoUrl), github = safeUrl(p?.github), linkedin = safeUrl(p?.linkedin), website = safeUrl(p?.website);
  const wa = p?.phone ? waLink(p.phone) : null;
  const featured = projects.filter((x) => x.isFeatured);
  const rest = projects.filter((x) => !x.isFeatured);

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

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <a href="#top" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-8 w-8 rounded-xl shadow-[0_0_16px_rgba(139,92,246,0.5)]" />
              <span className="font-display text-lg font-bold text-gradient">{brand}</span>
            </a>
            <ul className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              {menus.map((m) => (
                <li key={m.id}><a href={m.path} className="transition hover:text-white">{m.label}</a></li>
              ))}
            </ul>
            <a href="/login" className="btn-ghost btn-sm">Admin</a>
          </nav>
        </header>

        <main id="top">
          {/* Hero */}
          <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-5 pb-16 pt-20 text-center md:flex-row md:text-left md:pt-28">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="h-44 w-44 shrink-0 rounded-3xl border border-violet-400/40 object-cover shadow-[0_0_40px_rgba(139,92,246,0.45)]" />
            )}
            <div>
              {p?.tagline && (
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
                  <Sparkles className="h-4 w-4" /> {p.tagline}
                </span>
              )}
              <h1 className="font-display mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl">
                <span className="text-gradient">{p?.headline || name}</span>
              </h1>
              {p?.summary && <p className="mt-5 max-w-2xl text-lg text-slate-300/85">{p.summary}</p>}
              <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
                {show("proyek") && <a href="#proyek" className="btn-primary">Lihat Proyek <ArrowRight className="h-4 w-4" /></a>}
                {show("kontak") && <a href="#kontak" className="btn-ghost"><Mail className="h-4 w-4" /> Kontak</a>}
                {github && <a href={github} target="_blank" rel="noreferrer" className="btn-ghost"><SiGithub className="h-4 w-4" /> GitHub</a>}
                {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="btn-ghost"><FaLinkedin className="h-4 w-4" /> LinkedIn</a>}
              </div>
            </div>
          </section>

          {show("tentang") && p?.about && (
            <Section id="tentang" icon={<UserRound className="h-6 w-6" />} title="Tentang" accent="Saya" narrow>
              <p className="glass whitespace-pre-line rounded-2xl p-8 leading-relaxed text-slate-300">{p.about}</p>
            </Section>
          )}

          {show("biodata") && biodata.length > 0 && (
            <Section id="biodata" icon={<UserRound className="h-6 w-6" />} title="Bio" accent="data" narrow>
              <dl className="glass grid gap-x-8 gap-y-4 rounded-2xl p-8 sm:grid-cols-2">
                {biodata.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] uppercase tracking-wider text-violet-300">{k}</dt>
                    <dd className="text-slate-200">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {show("pengalaman") && experiences.length > 0 && (
            <Section id="pengalaman" icon={<Briefcase className="h-6 w-6" />} title="Pengalaman" accent="Kerja" narrow>
              <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-violet-500/60 before:via-cyan-400/30 before:to-transparent">
                {experiences.map((e) => (
                  <div key={e.id} className="relative pl-12">
                    <span className="absolute left-[7px] top-5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-violet-400 bg-[#0d0d1f] shadow-[0_0_12px_rgba(139,92,246,0.7)]">
                      <ExpIcon icon={e.icon} className="h-3.5 w-3.5 text-violet-300" />
                    </span>
                    <article className="glass rounded-2xl p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-bold text-white">{e.position}</h3>
                        {e.isCurrent && <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Saat ini</span>}
                      </div>
                      <p className="mt-1 text-sm font-medium text-violet-300">{e.company}{e.location && <span className="text-slate-400"> · {e.location}</span>}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{e.startDate} — {e.isCurrent ? "Sekarang" : e.endDate || "—"}</p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300/85">{e.description}</p>
                    </article>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {show("skill") && skills.length > 0 && (
            <Section id="skill" icon={<Sparkles className="h-6 w-6" />} title="Skill" accent="& Keahlian">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skillGroups.map(([cat, list]) => (
                  <div key={cat} className="glass rounded-2xl p-5">
                    <h3 className="mb-4 text-xs uppercase tracking-wider text-violet-300">{cat}</h3>
                    <ul className="space-y-3">
                      {list.map((s) => (
                        <li key={s.id}>
                          <div className="mb-1 flex justify-between text-sm"><span>{s.name}</span><span className="text-cyan-300">{s.level}%</span></div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" style={{ width: `${Math.min(100, Math.max(0, s.level))}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {show("sertifikasi") && certifications.length > 0 && (
            <Section id="sertifikasi" icon={<Award className="h-6 w-6" />} title="Serti" accent="fikasi">
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certifications.map((c) => {
                  const url = safeUrl(c.credentialUrl);
                  return (
                    <li key={c.id} className="glass rounded-2xl p-5">
                      <h3 className="font-display font-bold text-white">{c.name}</h3>
                      <p className="text-sm text-cyan-300">{c.issuer}</p>
                      <p className="mt-1 text-xs text-slate-400">Terbit {fmtDate(c.issueDate)}{c.expiryDate && ` · Berlaku s/d ${fmtDate(c.expiryDate)}`}</p>
                      {url && <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-fuchsia-300 hover:underline">Lihat kredensial →</a>}
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {show("proyek") && projects.length > 0 && (
            <Section id="proyek" icon={<Rocket className="h-6 w-6" />} title="Pro" accent="yek">
              {featured.length > 0 && (
                <>
                  <h3 className="mb-4 text-xs uppercase tracking-wider text-fuchsia-300">Unggulan</h3>
                  <ProjectGrid projects={featured} />
                </>
              )}
              {rest.length > 0 && (
                <>
                  <h3 className={`mb-4 text-xs uppercase tracking-wider text-cyan-300 ${featured.length ? "mt-10" : ""}`}><FolderKanban className="mr-1 inline h-4 w-4" /> Semua proyek</h3>
                  <ProjectGrid projects={rest} />
                </>
              )}
            </Section>
          )}

          {show("kontak") && (
            <Section id="kontak" icon={<Mail className="h-6 w-6" />} title="Mari" accent="Terhubung" narrow>
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-slate-300/80">Punya proyek atau ingin berdiskusi? Saya senang mendengarnya.</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {p?.email && <a href={`mailto:${p.email}`} className="btn-primary"><Mail className="h-4 w-4" /> {p.email}</a>}
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost"><Phone className="h-4 w-4" /> {p?.phone}</a>}
                  {github && <a href={github} target="_blank" rel="noreferrer" className="btn-ghost"><SiGithub className="h-4 w-4" /> GitHub</a>}
                  {linkedin && <a href={linkedin} target="_blank" rel="noreferrer" className="btn-ghost"><FaLinkedin className="h-4 w-4" /> LinkedIn</a>}
                  {website && <a href={website} target="_blank" rel="noreferrer" className="btn-ghost"><Globe className="h-4 w-4" /> Website</a>}
                </div>
              </div>
            </Section>
          )}
        </main>

        <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} {name} — dibangun dengan Next.js
        </footer>
      </div>
    </div>
  );
}
