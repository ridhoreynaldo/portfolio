"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import Forbidden from "@/components/Forbidden";
import { api, useAdminData } from "@/components/admin/useAdminData";
import { AVAILABLE_ICONS, ICONS } from "@/components/admin/icons";
import type { MenuNode } from "@/lib/menu-types";
import type { Role } from "@/db/schema";

interface FlatMenu extends MenuNode {
  depth: number;
}

function flatten(tree: MenuNode[], depth = 0): FlatMenu[] {
  const out: FlatMenu[] = [];
  for (const n of tree) {
    out.push({ ...n, depth });
    out.push(...flatten(n.children, depth + 1));
  }
  return out;
}

const EMPTY = {
  label: "",
  icon: "LayoutDashboard",
  path: "#",
  parentId: "",
  sortOrder: 0,
  isActive: true,
  roleIds: [] as string[],
};

export default function MenusPage() {
  const { data, error, loading, reload } = useAdminData<{ tree: MenuNode[] }>(
    "/api/admin/menus"
  );
  const { data: rolesData } = useAdminData<{ roles: Role[] }>("/api/admin/roles");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const roles = rolesData?.roles ?? [];
  const flat = data ? flatten(data.tree) : [];

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(m: FlatMenu) {
    setEditingId(m.id);
    setForm({
      label: m.label,
      icon: m.icon,
      path: m.path,
      parentId: "",
      sortOrder: m.sortOrder,
      isActive: m.isActive,
      roleIds: m.roleIds,
    });
    // parentId perlu diambil dari struktur tree
    const findParent = (tree: MenuNode[], childId: string): string => {
      for (const n of tree) {
        if (n.children.some((c) => c.id === childId)) return n.id;
        const deeper = findParent(n.children, childId);
        if (deeper) return deeper;
      }
      return "";
    };
    setForm((f) => ({
      ...f,
      parentId: data ? findParent(data.tree, m.id) : "",
    }));
    setFormError("");
    setModalOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder),
      };
      if (editingId) {
        await api(`/api/admin/menus/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/menus", {
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

  async function onDelete(id: string, label: string) {
    if (!confirm(`Hapus menu "${label}" beserta submenu-nya?`)) return;
    try {
      await api(`/api/admin/menus/${id}`, { method: "DELETE" });
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
          Menu <span className="text-gradient">Dinamis</span>
        </h2>
        <button onClick={openCreate} className="btn-primary !py-2 text-sm">
          <Plus className="h-4 w-4" /> Tambah Menu
        </button>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5">Label</th>
              <th className="px-5 py-3.5">Path</th>
              <th className="px-5 py-3.5">Urutan</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Memuat...</td></tr>
            ) : flat.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">Belum ada menu.</td></tr>
            ) : (
              flat.map((m) => {
                const Icon = ICONS[m.icon] ?? ICONS.LayoutDashboard;
                return (
                  <tr key={m.id} className="border-b border-white/5 transition hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2" style={{ paddingLeft: m.depth * 20 }}>
                        <Icon className="h-4 w-4 text-violet-300" />
                        <span className="font-medium text-slate-200">{m.label}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{m.path}</td>
                    <td className="px-5 py-3.5 text-slate-400">{m.sortOrder}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${m.isActive ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-400"}`}>
                        {m.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white" title="Ubah">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => onDelete(m.id, m.label)} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Modal title={editingId ? "Ubah Menu" : "Tambah Menu"} onClose={() => setModalOpen(false)} wide>
          <form onSubmit={onSave} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Label</label>
              <input className="input-dark" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>
            <div>
              <label className="label">Ikon</label>
              <select className="input-dark" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                {AVAILABLE_ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Path</label>
              <input className="input-dark" value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} placeholder="/admin/contoh atau #" />
            </div>
            <div>
              <label className="label">Parent</label>
              <select className="input-dark" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">(Tidak ada — menu utama)</option>
                {flat.filter((m) => m.id !== editingId).map((m) => (
                  <option key={m.id} value={m.id}>{"— ".repeat(m.depth)}{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Urutan</label>
              <input type="number" className="input-dark" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-violet-500" />
                Aktif
              </label>
            </div>
            <div className="md:col-span-2">
              <span className="label">Terlihat oleh peran</span>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label key={r.id} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm transition ${form.roleIds.includes(r.id) ? "border-violet-400/60 bg-violet-500/20 text-violet-100" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25"}`}>
                    <input type="checkbox" className="hidden" checked={form.roleIds.includes(r.id)} onChange={() => toggleRole(r.id)} />
                    {r.name}
                  </label>
                ))}
              </div>
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
