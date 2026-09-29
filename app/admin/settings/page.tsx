"use client";

import { useState } from "react";
import { Plus, Save, Trash2, KeyRound } from "lucide-react";
import Forbidden from "@/components/Forbidden";
import { api, useAdminData } from "@/components/admin/useAdminData";

export default function SettingsPage() {
  const { data, error, loading, reload } = useAdminData<{ settings: Record<string, string> }>(
    "/api/admin/settings"
  );
  const [rows, setRows] = useState<[string, string][] | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const current: [string, string][] =
    rows ?? (data ? Object.entries(data.settings) : []);

  function setRow(i: number, k: number, v: string) {
    const next = [...current];
    next[i] = k === 0 ? [v, next[i][1]] : [next[i][0], v];
    setRows(next);
  }

  function addRow() {
    setRows([...current, ["", ""]]);
  }

  function removeRow(i: number) {
    setRows(current.filter((_, idx) => idx !== i));
  }

  async function onSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const settings: Record<string, string> = {};
      for (const [k, v] of current) {
        if (k.trim()) settings[k.trim()] = v;
      }
      await api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ settings }) });
      setMsg("Pengaturan tersimpan.");
      setRows(null);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteKey(key: string) {
    if (!key || !confirm(`Hapus pengaturan "${key}"?`)) return;
    try {
      await api(`/api/admin/settings?key=${encodeURIComponent(key)}`, { method: "DELETE" });
      reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus");
    }
  }

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    if (pw.next !== pw.confirm) {
      setPwMsg("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setPwSaving(true);
    try {
      await api("/api/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });
      setPwMsg("Kata sandi berhasil diubah.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwMsg(err instanceof Error ? err.message : "Gagal mengubah kata sandi");
    } finally {
      setPwSaving(false);
    }
  }

  if (error === "FORBIDDEN") return <Forbidden />;

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl font-bold text-white">
        <span className="text-gradient">Pengaturan</span> Situs
      </h2>

      <form onSubmit={onSaveSettings} className="glass rounded-2xl p-6">
        <h3 className="font-display mb-4 text-lg font-bold text-white">
          Konten Situs (key → value)
        </h3>
        {loading ? (
          <p className="text-sm text-slate-500">Memuat...</p>
        ) : (
          <div className="space-y-3">
            {current.map(([k, v], i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[220px_1fr_auto]">
                <input
                  className="input-dark font-mono text-sm"
                  placeholder="key, mis. hero_title"
                  value={k}
                  onChange={(e) => setRow(i, 0, e.target.value)}
                />
                <input
                  className="input-dark text-sm"
                  placeholder="value"
                  value={v}
                  onChange={(e) => setRow(i, 1, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => { removeRow(i); if (k && data?.settings[k] !== undefined) onDeleteKey(k); }}
                  className="rounded-xl border border-white/10 p-2.5 text-slate-400 transition hover:border-red-400/40 hover:text-red-300"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addRow} className="btn-ghost !py-2 text-sm">
              <Plus className="h-4 w-4" /> Tambah Baris
            </button>
          </div>
        )}
        {msg && <p className="mt-4 text-sm text-cyan-200">{msg}</p>}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>

      <form onSubmit={onChangePassword} className="glass rounded-2xl p-6">
        <h3 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-white">
          <KeyRound className="h-5 w-5 text-violet-300" /> Ganti Kata Sandi
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Kata Sandi Lama</label>
            <input type="password" className="input-dark" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
          </div>
          <div>
            <label className="label">Kata Sandi Baru</label>
            <input type="password" className="input-dark" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="label">Konfirmasi Baru</label>
            <input type="password" className="input-dark" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required minLength={6} />
          </div>
        </div>
        {pwMsg && <p className="mt-4 text-sm text-cyan-200">{pwMsg}</p>}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={pwSaving} className="btn-primary">
            {pwSaving ? "Menyimpan..." : "Ubah Kata Sandi"}
          </button>
        </div>
      </form>
    </div>
  );
}
