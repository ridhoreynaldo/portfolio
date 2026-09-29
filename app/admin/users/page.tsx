"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Forbidden from "@/components/Forbidden";
import { api, useAdminData } from "@/components/admin/useAdminData";
import type { Role } from "@/db/schema";

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  roleIds: string[];
  roles: string[];
}

const EMPTY = {
  name: "",
  email: "",
  password: "",
  isActive: true,
  roleIds: [] as string[],
};

export default function UsersPage() {
  const { data, error, loading, reload } = useAdminData<{
    users: UserRow[];
    roles: Role[];
  }>("/api/admin/users");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const roles = data?.roles ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", isActive: u.isActive, roleIds: u.roleIds });
    setFormError("");
    setModalOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          isActive: form.isActive,
          roleIds: form.roleIds,
        };
        if (form.password) payload.password = form.password;
        await api(`/api/admin/users/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(u: UserRow) {
    if (!confirm(`Hapus pengguna "${u.name}" (${u.email})?`)) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  function toggleRole(roleId: string) {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((r) => r !== roleId)
        : [...f.roleIds, roleId],
    }));
  }

  if (error === "FORBIDDEN") return <Forbidden />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">
          Pengguna <span className="text-gradient">& Peran</span>
        </h2>
        <button onClick={openCreate} className="btn-primary !py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Pengguna
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Nama</th>
              <th className="px-5 py-3.5">Email</th>
              <th className="px-5 py-3.5">Peran</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>
            ) : !data || data.users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Belum ada pengguna.</td></tr>
            ) : (
              data.users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5 font-medium text-slate-200">{u.name}</td>
                  <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-xs text-violet-200">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${u.isActive ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(u)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDelete(u)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300" title="Hapus">
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
        <Modal title={editing ? "Ubah Pengguna" : "Tambah Pengguna"} onClose={() => setModalOpen(false)}>
          <form onSubmit={onSave} className="grid gap-4">
            <div>
              <label className="label">Nama</label>
              <input className="input-dark" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-dark" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Kata Sandi {editing && <span className="normal-case text-slate-500">(kosongkan jika tidak diubah)</span>}</label>
              <input type="password" className="input-dark" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
            </div>
            <div>
              <span className="label">Peran</span>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label key={r.id} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ${form.roleIds.includes(r.id) ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25"}`}>
                    <input type="checkbox" className="hidden" checked={form.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-violet-500" />
              Akun aktif
            </label>
            {formError && <p className="text-sm text-red-300">{formError}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
