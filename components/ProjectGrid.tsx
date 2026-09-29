"use client";

import { useState } from "react";
import {
  ExternalLink,
  FolderKanban,
  Github,
  MousePointerClick,
  Users,
  Zap,
} from "lucide-react";
import Modal from "@/components/Modal";
import TechIcon from "@/components/TechIcon";
import type { Project } from "@/db/schema";

function TagBadge({ tag, small, iconUrl }: { tag: string; small?: boolean; iconUrl?: string | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 ${
        small ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs font-medium"
      }`}
    >
      <TechIcon name={tag} iconUrl={iconUrl} className="h-3.5 w-3.5 shrink-0" />
      {tag}
    </span>
  );
}

function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const fullDescription = p.detailDescription?.trim() || p.description;
  const techStack = p.techStack ?? [];
  const tags = p.tags ?? [];
  const tagIcons = p.tagIcons ?? {};

  return (
    <Modal title={p.title} onClose={onClose} wide>
      {p.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.imageUrl}
          alt={p.title}
          className="mb-5 h-56 w-full rounded-xl object-cover"
        />
      )}

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
        {fullDescription}
      </p>

      {techStack.length > 0 ? (
        <div className="mt-5">
          <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tech Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {techStack.map((t) => (
              <TagBadge key={t} tag={t} iconUrl={tagIcons[t]} />
            ))}
          </div>
        </div>
      ) : (
        tags.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tag
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <TagBadge key={t} tag={t} iconUrl={tagIcons[t]} />
              ))}
            </div>
          </div>
        )
      )}

      {(p.totalUsers || p.concurrentUsers) && (
        <div className="mt-5 grid grid-cols-2 gap-3">
          {p.totalUsers && (
            <div className="glass rounded-xl p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-violet-300" />
              <div className="font-display mt-2 text-2xl font-extrabold text-white">
                {p.totalUsers}
              </div>
              <div className="mt-1 text-xs text-slate-400">Total Pengguna</div>
            </div>
          )}
          {p.concurrentUsers && (
            <div className="glass rounded-xl p-4 text-center">
              <Zap className="mx-auto h-5 w-5 text-amber-300" />
              <div className="font-display mt-2 text-2xl font-extrabold text-white">
                {p.concurrentUsers}
              </div>
              <div className="mt-1 text-xs text-slate-400">Pengguna Bersamaan</div>
            </div>
          )}
        </div>
      )}

      {(p.demoUrl || p.repoUrl) && (
        <div className="mt-6 flex gap-3">
          {p.demoUrl && (
            <a
              href={p.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !py-2 text-sm"
            >
              <ExternalLink className="h-4 w-4" /> Lihat Demo
            </a>
          )}
          {p.repoUrl && (
            <a
              href={p.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost !py-2 text-sm"
            >
              <Github className="h-4 w-4" /> Kode Sumber
            </a>
          )}
        </div>
      )}
    </Modal>
  );
}

function ProjectCard({ p, onOpen }: { p: Project; onOpen: () => void }) {
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
              <TagBadge key={t} tag={t} small iconUrl={(p.tagIcons ?? {})[t]} />
            ))}
          </div>
        )}
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-500 transition group-hover:text-violet-300">
          <MousePointerClick className="h-3.5 w-3.5" /> Klik untuk detail
        </p>
      </div>
    </article>
  );
}

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} p={p} onOpen={() => setSelected(p)} />
        ))}
      </div>
      {selected && (
        <ProjectModal p={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
