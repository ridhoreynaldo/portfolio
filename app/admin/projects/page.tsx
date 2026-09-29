"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Forbidden from "@/components/Forbidden";
import ChipInput from "@/components/admin/ChipInput";
import { api, useAdminData } from "@/components/admin/useAdminData";
import type { Project } from "@/db/schema";

const EMPTY = {
  title: "",
  slug: "",
  description: "",
  detailDescription: "",
  imageUrl: "",
  tags: [] as string[],
  techStack: [] as string[],
  tagIcons: {} as Record<string, string>,
  totalUsers: "",
  concurrentUsers: "",
  demoUrl: "",
  repoUrl: "",
  isFeatured: false,
  isPublished: true,
  sortOrder: 0,
};

function autoSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProjectsPage() {
  const { data, error, loading, reload } = useAdminData<{ projects: Project[] }>(
    "/api/admin/projects"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setSlugTouched(false);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      description: p.description,
      detailDescription: p.detailDescription ?? "",
      imageUrl: p.imageUrl ?? "",
      tags: [...(p.tags ?? [])],
      techStack: [...(p.techStack ?? [])],
      tagIcons: { ...(p.tagIcons ?? {}) },
      totalUsers: p.totalUsers ?? "",
      concurrentUsers: p.concurrentUsers ?? "",
      demoUrl: p.demoUrl ?? "",
      repoUrl: p.repoUrl ?? "",
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
      sortOrder: p.sortOrder,
    });
    setSlugTouched(true);
    setFormError("");
    setModalOpen(true);
  }

  function onTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : autoSlug(title) }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      // Bersihkan tagIcons: hanya untuk tag yang masih ada & URL tidak kosong
      const tagIcons: Record<string, string> = {};
      for (const t of form.tags) {
        const url = (form.tagIcons[t] || "").trim();
        if (url) tagIcons[t] = url;
      }
      const payload = { ...form, tagIcons, sortOrder: Number(form.sortOrder) };
      if (editing) {
        await api(`/api/admin/projects/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/admin/projects", { method: "POST", body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p: Project) {
    if (!confirm(`Hapus proyek "${p.title}"?`)) return;
    try {
      await api(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  if (error === "FORBIDDEN") return <Forbidden />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">
          Kelola <span className="text-gradient">Proyek</span>
        </h2>
        <button onClick={openCreate} className="btn-primary !py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Proyek
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Judul</th>
              <th className="px-5 py-3.5">Slug</th>
              <th className="px-5 py-3.5">Tag</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>
            ) : !data || data.projects.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Belum ada proyek.</td></tr>
            ) : (
              data.projects.map((p) => (
                <tr key={p.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-200">{p.title}</span>
                    {p.isFeatured && (
                      <span className="ml-2 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-xs text-fuchsia-200">Unggulan</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{p.slug}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${p.isPublished ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-400"}`}>
                      {p.isPublished ? "Terbit" : "Draf"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(p)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? "Ubah Proyek" : "Tambah Proyek"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Judul</label>
              <input className="input-dark" value={form.title} onChange={(e) => onTitleChange(e.target.value)} required />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input-dark font-mono" value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }} placeholder="otomatis dari judul" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Deskripsi</label>
              <textarea className="input-dark min-h-[110px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Deskripsi Detail <span className="font-normal text-slate-500">(opsional, tampil di modal)</span></label>
              <textarea className="input-dark min-h-[140px]" value={form.detailDescription} onChange={(e) => setForm({ ...form, detailDescription: e.target.value })} placeholder="Cerita lengkap proyek: latar belakang, tantangan, solusi..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">URL Gambar</label>
              <input className="input-dark" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <ChipInput
                label="Tag"
                values={form.tags}
                onChange={(tags) => setForm({ ...form, tags })}
                placeholder="Ketik tag lalu Enter, mis. Next.js"
              />
              {form.tags.length > 0 && (
                <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="text-xs text-slate-500">URL icon custom per tag <span className="text-slate-600">(opsional — kosongkan untuk pakai icon otomatis)</span></p>
                  {form.tags.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 truncate rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs text-cyan-200">{t}</span>
                      <input
                        className="input-dark !py-1.5 text-xs"
                        value={form.tagIcons[t] || ""}
                        onChange={(e) => setForm({ ...form, tagIcons: { ...form.tagIcons, [t]: e.target.value } })}
                        placeholder="https://.../icon.png"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <ChipInput
                label="Tech Stack"
                values={form.techStack}
                onChange={(techStack) => setForm({ ...form, techStack })}
                placeholder="Ketik lalu Enter, mis. PostgreSQL"
              />
            </div>
            <div>
              <label className="label">Total Pengguna <span className="font-normal text-slate-500">(opsional)</span></label>
              <input className="input-dark" value={form.totalUsers} onChange={(e) => setForm({ ...form, totalUsers: e.target.value })} placeholder="mis. 10.000+" />
            </div>
            <div>
              <label className="label">Pengguna Bersamaan <span className="font-normal text-slate-500">(opsional)</span></label>
              <input className="input-dark" value={form.concurrentUsers} onChange={(e) => setForm({ ...form, concurrentUsers: e.target.value })} placeholder="mis. 500" />
            </div>
            <div>
              <label className="label">URL Demo</label>
              <input className="input-dark" value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className="label">URL Repo</label>
              <input className="input-dark" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="label">Urutan</label>
              <input type="number" className="input-dark" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="h-4 w-4 accent-fuchsia-500" />
                Unggulan
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 accent-emerald-500" />
                Terbit
              </label>
            </div>
            {formError && <p className="text-sm text-red-300 md:col-span-2">{formError}</p>}
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
