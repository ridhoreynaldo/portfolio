"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Forbidden from "@/components/Forbidden";
import { api, useAdminData } from "@/components/admin/useAdminData";
import type { Menu, Permission, Role } from "@/db/schema";

interface RoleRow extends Role {
  permissionIds: string[];
  menuIds: string[];
}

const EMPTY = {
  name: "",
  description: "",
  permissionIds: [] as string[],
  menuIds: [] as string[],
};

export default function RolesPage() {
  const { data, error, loading, reload } = useAdminData<{
    roles: RoleRow[];
    permissions: Permission[];
    menus: Menu[];
  }>("/api/admin/roles");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const permissions = data?.permissions ?? [];
  const menus = data?.menus ?? [];
  const isSuperAdmin = editing?.name === "super_admin";

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(r: RoleRow) {
    setEditing(r);
    setForm({
      name: r.name,
      description: r.description ?? "",
      permissionIds: r.permissionIds,
      menuIds: r.menuIds,
    });
    setFormError("");
    setModalOpen(true);
  }

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api(`/api/admin/roles/${editing.id}`, { method: "PUT", body: JSON.stringify(form) });
      } else {
        await api("/api/admin/roles", { method: "POST", body: JSON.stringify(form) });
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(r: RoleRow) {
    if (!confirm(`Hapus peran "${r.name}"?`)) return;
    try {
      await api(`/api/admin/roles/${r.id}`, { method: "DELETE" });
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
          Peran <span className="text-gradient">& Akses</span>
        </h2>
        <button onClick={openCreate} className="btn-primary !py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Peran
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Nama</th>
              <th className="px-5 py-3.5">Deskripsi</th>
              <th className="px-5 py-3.5">Izin</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>
            ) : !data || data.roles.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Belum ada peran.</td></tr>
            ) : (
              data.roles.map((r) => (
                <tr key={r.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                  <td className="px-5 py-3.5">
                    <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 font-mono text-xs text-violet-200">{r.name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">{r.description || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-400">{r.permissionIds.length} izin · {r.menuIds.length} menu</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(r)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Ubah">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {r.name !== "super_admin" && (
                        <button onClick={() => onDelete(r)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editing ? "Ubah Peran" : "Tambah Peran"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={onSave} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Nama Peran</label>
                <input
                  className="input-dark font-mono"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  disabled={isSuperAdmin}
                  title={isSuperAdmin ? "Nama super_admin tidak boleh diubah" : undefined}
                />
              </div>
              <div>
                <label className="label">Deskripsi</label>
                <input className="input-dark" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div>
              <span className="label">Izin (permissions)</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40">
                    <input
                      type="checkbox"
                      checked={form.permissionIds.includes(p.id)}
                      onChange={() => setForm({ ...form, permissionIds: toggle(form.permissionIds, p.id) })}
                      className="mt-0.5 h-4 w-4 accent-violet-500"
                    />
                    <span>
                      <span className="block font-mono text-xs text-violet-200">{p.key}</span>
                      <span className="block text-xs text-slate-500">{p.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Menu yang terlihat</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {menus.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-cyan-400/40">
                    <input
                      type="checkbox"
                      checked={form.menuIds.includes(m.id)}
                      onChange={() => setForm({ ...form, menuIds: toggle(form.menuIds, m.id) })}
                      className="h-4 w-4 accent-cyan-500"
                    />
                    <span className="text-sm text-slate-300">{m.label}</span>
                    <span className="font-mono text-xs text-slate-600">{m.path}</span>
                  </label>
                ))}
              </div>
            </div>
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
