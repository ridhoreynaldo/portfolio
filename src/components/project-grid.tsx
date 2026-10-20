"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FolderKanban, MousePointerClick, Users, X, Zap } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { TechIcon } from "./tech-icon";
import { safeUrl } from "@/shared/url";
import type { PublicProject } from "@/modules/portfolio/service";

function TagBadge({ tag, small, iconUrl }: { tag: string; small?: boolean; iconUrl?: string | null }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 ${small ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs font-medium"}`}>
      <TechIcon name={tag} iconUrl={iconUrl} className="h-3.5 w-3.5 shrink-0" />
      {tag}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="glass max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Tutup"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProjectModal({ p, onClose }: { p: PublicProject; onClose: () => void }) {
  const stack = p.techStack.length ? p.techStack : p.tags;
  const img = safeUrl(p.imageUrl), demo = safeUrl(p.demoUrl), repo = safeUrl(p.repoUrl);
  return (
    <Modal title={p.title} onClose={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img && <img src={img} alt={p.title} className="mb-5 h-56 w-full rounded-xl object-cover" />}
      <p className="text-xs uppercase tracking-wider text-violet-300">{[p.role, p.year].filter(Boolean).join(" · ")}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{p.detailDescription?.trim() || p.description}</p>
      {stack.length > 0 && (
        <div className="mt-5">
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">{stack.map((t) => <TagBadge key={t} tag={t} iconUrl={p.tagIcons[t]} />)}</div>
        </div>
      )}
      {(p.totalUsers || p.concurrentUsers) && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {p.totalUsers && <div className="glass rounded-xl p-4 text-center"><Users className="mx-auto h-5 w-5 text-violet-300" /><div className="font-display mt-2 text-2xl font-extrabold text-white">{p.totalUsers}</div><div className="mt-1 text-xs text-slate-400">Total Pengguna</div></div>}
          {p.concurrentUsers && <div className="glass rounded-xl p-4 text-center"><Zap className="mx-auto h-5 w-5 text-amber-300" /><div className="font-display mt-2 text-2xl font-extrabold text-white">{p.concurrentUsers}</div><div className="mt-1 text-xs text-slate-400">Pengguna Bersamaan</div></div>}
        </div>
      )}
      {(demo || repo) && (
        <div className="mt-6 flex flex-wrap gap-3">
          {demo && <a href={demo} target="_blank" rel="noreferrer" className="btn-primary !py-2 text-sm"><ExternalLink className="h-4 w-4" /> Lihat Demo</a>}
          {repo && <a href={repo} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-sm"><SiGithub className="h-4 w-4" /> Kode Sumber</a>}
        </div>
      )}
    </Modal>
  );
}

function ProjectCard({ p, onOpen }: { p: PublicProject; onOpen: () => void }) {
  const img = safeUrl(p.imageUrl);
  return (
    <article
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      tabIndex={0}
      role="button"
      aria-label={`Lihat detail ${p.title}`}
      className="glass group cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-400/40 hover:shadow-[0_20px_60px_-15px_rgba(124,58,237,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-violet-900/40 via-[#0d0d1f] to-cyan-900/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img ? <img src={img} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <div className="flex h-full items-center justify-center"><FolderKanban className="h-12 w-12 text-violet-300/40" /></div>}
        {p.isFeatured && <span className="absolute left-3 top-3 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs font-semibold text-fuchsia-200 backdrop-blur">Unggulan</span>}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-white">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-slate-300/80">{p.description}</p>
        {p.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{p.tags.map((t) => <TagBadge key={t} tag={t} small iconUrl={p.tagIcons[t]} />)}</div>}
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition group-hover:text-violet-300"><MousePointerClick className="h-3.5 w-3.5" /> Klik untuk detail</p>
      </div>
    </article>
  );
}

export function ProjectGrid({ projects }: { projects: PublicProject[] }) {
  const [selected, setSelected] = useState<PublicProject | null>(null);
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setSelected(p)} />)}
      </div>
      {selected && <ProjectModal p={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
