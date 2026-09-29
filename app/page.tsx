import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { experiences, projects, siteSettings } from "@/db/schema";
import {
  ArrowRight,
  Briefcase,
  FolderKanban,
  Github,
  Linkedin,
  Mail,
  Phone,
  Rocket,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

async function getSettings(): Promise<Record<string, string>> {
  try {
    const rows = await db.select().from(siteSettings);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

function ProjectCard({ p }: { p: typeof projects.$inferSelect }) {
  return (
    <article className="glass group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:shadow-[0_20px_60px_-15px_rgba(124,58,237,0.45)]">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-900/40 via-[#0d0d1f] to-cyan-900/30">
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FolderKanban className="h-12 w-12 text-violet-300/40" />
          </div>
        )}
        {p.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-200 backdrop-blur">
            Unggulan
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-white">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-slate-300/80">{p.description}</p>
        {p.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-0.5 text-xs text-cyan-200"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex gap-3">
          {p.demoUrl && (
            <a
              href={p.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200"
            >
              <ExternalLink className="h-4 w-4" /> Demo
            </a>
          )}
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
            >
              <Github className="h-4 w-4" /> Kode
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function HomePage() {
  const s = await getSettings();
  const siteName = s.site_name || "Portfolio Saya";
  const tagline = s.tagline || "Membangun solusi digital yang andal & elegan";
  const heroTitle = s.hero_title || "Halo, saya seorang Developer";
  const heroSubtitle =
    s.hero_subtitle ||
    "Saya merancang dan membangun aplikasi web modern — dari backend yang kokoh hingga antarmuka yang memukau.";
  const aboutText =
    s.about_text ||
    "Saya seorang pengembang perangkat lunak yang berfokus pada aplikasi web. Saya senang mengubah ide menjadi produk yang cepat, aman, dan mudah digunakan.";
  const email = s.contact_email || s.email || "halo@example.com";
  const phone = s.contact_phone || "";
  const githubUrl = s.github_url || "#";
  const linkedinUrl = s.contact_linkedin || s.linkedin_url || "#";

  let featured: (typeof projects.$inferSelect)[] = [];
  let rest: (typeof projects.$inferSelect)[] = [];
  let expList: (typeof experiences.$inferSelect)[] = [];
  try {
    const all = await db
      .select()
      .from(projects)
      .where(eq(projects.isPublished, true))
      .orderBy(asc(projects.sortOrder));
    featured = all.filter((p) => p.isFeatured);
    rest = all.filter((p) => !p.isFeatured);
  } catch {
    // DB belum siap — tampilkan halaman tanpa proyek
  }
  try {
    expList = await db
      .select()
      .from(experiences)
      .orderBy(asc(experiences.sortOrder));
  } catch {
    // DB belum siap / tabel belum ada — tampilkan halaman tanpa pengalaman
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="font-display text-xl font-bold">
            <span className="text-gradient">{siteName}</span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#proyek" className="transition hover:text-white">Proyek</a>
            <a href="#pengalaman" className="transition hover:text-white">Pengalaman</a>
            <a href="#tentang" className="transition hover:text-white">Tentang</a>
            <a href="#kontak" className="transition hover:text-white">Kontak</a>
          </div>
          <a href="#kontak" className="btn-primary !px-5 !py-2 text-sm">
            Hubungi Saya
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center md:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200">
          <Sparkles className="h-4 w-4" /> {tagline}
        </span>
        <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight md:text-7xl">
          <span className="text-gradient">{heroTitle}</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300/85">{heroSubtitle}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a href="#proyek" className="btn-primary">
            Lihat Proyek <ArrowRight className="h-4 w-4" />
          </a>
          <a href="#kontak" className="btn-ghost">
            <Mail className="h-4 w-4" /> Kontak
          </a>
        </div>
        <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4">
          {[
            { n: `${featured.length + rest.length}+`, l: "Proyek" },
            { n: "100%", l: "Komitmen" },
            { n: "24/7", l: "Siap Bekerja" },
          ].map((st) => (
            <div key={st.l} className="glass rounded-2xl px-4 py-5">
              <div className="font-display text-gradient text-3xl font-extrabold">{st.n}</div>
              <div className="mt-1 text-sm text-slate-400">{st.l}</div>
            </div>
          ))}
        </div>
      </section>

      <hr className="hr-glow mx-auto max-w-6xl" />

      {/* Proyek unggulan */}
      {featured.length > 0 && (
        <section id="proyek" className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-8 flex items-center gap-3">
            <Rocket className="h-6 w-6 text-fuchsia-300" />
            <h2 className="font-display text-3xl font-bold">
              Proyek <span className="text-gradient">Unggulan</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Semua proyek */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-8 flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-cyan-300" />
          <h2 className="font-display text-3xl font-bold">
            Semua <span className="text-gradient">Proyek</span>
          </h2>
        </div>
        {rest.length === 0 && featured.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-slate-400">
            Belum ada proyek yang dipublikasikan.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      <hr className="hr-glow mx-auto max-w-6xl" />

      {/* Pengalaman kerja */}
      {expList.length > 0 && (
        <section id="pengalaman" className="mx-auto max-w-4xl px-5 py-16">
          <div className="mb-10 flex items-center justify-center gap-3">
            <Briefcase className="h-6 w-6 text-violet-300" />
            <h2 className="font-display text-3xl font-bold">
              Pengalaman <span className="text-gradient">Kerja</span>
            </h2>
          </div>
          <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-px before:bg-gradient-to-b before:from-violet-500/60 before:via-cyan-400/30 before:to-transparent md:before:left-[23px]">
            {expList.map((e) => (
              <div key={e.id} className="relative pl-12 md:pl-14">
                <span className="absolute left-[11px] top-6 h-4 w-4 rounded-full border-2 border-violet-400 bg-[#0d0d1f] shadow-[0_0_12px_rgba(139,92,246,0.7)] md:left-[15px]" />
                <article className="glass rounded-2xl p-6 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-white">
                      {e.position}
                    </h3>
                    {e.isCurrent && (
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Saat ini
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-violet-300">
                    {e.company}
                    {e.location && <span className="text-slate-400"> · {e.location}</span>}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {e.startDate} — {e.isCurrent ? "Sekarang" : e.endDate || "?"}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300/85">
                    {e.description}
                  </p>
                </article>
              </div>
            ))}
          </div>
        </section>
      )}

      <hr className="hr-glow mx-auto max-w-6xl" />

      {/* Tentang */}
      <section id="tentang" className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">
          Tentang <span className="text-gradient">Saya</span>
        </h2>
        <p className="glass mt-6 rounded-2xl p-8 text-left leading-relaxed text-slate-300">
          {aboutText}
        </p>
      </section>

      {/* Kontak */}
      <section id="kontak" className="mx-auto max-w-4xl px-5 py-16 text-center">
        <h2 className="font-display text-3xl font-bold">
          Mari <span className="text-gradient">Terhubung</span>
        </h2>
        <p className="mt-4 text-slate-300/80">
          Punya proyek atau sekadar ingin berdiskusi? Saya senang mendengarnya.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href={`mailto:${email}`} className="btn-primary">
            <Mail className="h-4 w-4" /> {email}
          </a>
          {phone && (
            <a href={waLink(phone)} target="_blank" rel="noreferrer" className="btn-ghost">
              <Phone className="h-4 w-4" /> {phone}
            </a>
          )}
          <a href={githubUrl} target="_blank" rel="noreferrer" className="btn-ghost">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a href={linkedinUrl} target="_blank" rel="noreferrer" className="btn-ghost">
            <Linkedin className="h-4 w-4" /> LinkedIn
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {siteName} — Dibangun dengan Next.js
      </footer>
    </div>
  );
}
