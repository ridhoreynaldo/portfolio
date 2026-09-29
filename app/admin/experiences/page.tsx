"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Forbidden from "@/components/Forbidden";
import { api, useAdminData } from "@/components/admin/useAdminData";
import type { Experience } from "@/db/schema";

const EMPTY = {
  company: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  description: "",
  sortOrder: 0,
};

function periodLabel(e: Experience): string {
  const start = e.startDate || "?";
  const end = e.isCurrent ? "Sekarang" : e.endDate || "?";
  return `${start} — ${end}`;
}

export default function ExperiencesPage() {
  const { data, error, loading, reload } = useAdminData<{ experiences: Experience[] }>(
    "/api/admin/experiences"
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(e: Experience) {
    setEditing(e);
    setForm({
      company: e.company,
      position: e.position,
      location: e.location ?? "",
      startDate: e.startDate,
      endDate: e.endDate ?? "",
      isCurrent: e.isCurrent,
      description: e.description,
      sortOrder: e.sortOrder,
    });
    setFormError("");
    setModalOpen(true);
  }

  async function onSave(ev: React.FormEvent) {
    ev.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder) };
      if (editing) {
        await api(`/api/admin/experiences/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/experiences", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(e: Experience) {
    if (!confirm(`Hapus pengalaman "${e.position} di ${e.company}"?`)) return;
    try {
      await api(`/api/admin/experiences/${e.id}`, { method: "DELETE" });
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
          Kelola <span className="text-gradient">Pengalaman</span>
        </h2>
        <button onClick={openCreate} className="btn-primary !py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Pengalaman
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Posisi</th>
              <th className="px-5 py-3.5">Perusahaan</th>
              <th className="px-5 py-3.5">Periode</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>
            ) : !data || data.experiences.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Belum ada pengalaman kerja.</td></tr>
            ) : (
              data.experiences.map((e) => (
                <tr key={e.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5 font-medium text-slate-200">{e.position}</td>
                  <td className="px-5 py-3.5 text-slate-300">
                    {e.company}
                    {e.location && <span className="block text-xs text-slate-500">{e.location}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{periodLabel(e)}</td>
                  <td className="px-5 py-3.5">
                    {e.isCurrent ? (
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-400/10 px-2.5 py-1 text-xs text-slate-400">
                        Selesai
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(e)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(e)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300" title="Hapus">
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
        <Modal title={editing ? "Ubah Pengalaman" : "Tambah Pengalaman"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Posisi / Jabatan</label>
              <input className="input-dark" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="mis. Backend Developer" required />
            </div>
            <div>
              <label className="label">Perusahaan</label>
              <input className="input-dark" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="mis. PT Contoh Sukses" required />
            </div>
            <div>
              <label className="label">Lokasi</label>
              <input className="input-dark" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="mis. Jakarta / Remote" />
            </div>
            <div>
              <label className="label">Urutan</label>
              <input type="number" className="input-dark" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Tanggal Mulai</label>
              <input className="input-dark" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="mis. Jan 2022" required />
            </div>
            <div>
              <label className="label">Tanggal Selesai</label>
              <input className="input-dark" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder="mis. Des 2023" disabled={form.isCurrent} />
            </div>
            <div className="flex items-end pb-1 md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked, endDate: e.target.checked ? "" : form.endDate })} className="h-4 w-4 accent-emerald-500" />
                Masih bekerja di sini
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="label">Deskripsi Pekerjaan</label>
              <textarea className="input-dark min-h-[110px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ceritakan tanggung jawab dan pencapaian..." required />
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
