import Link from "next/link";
import { Badge, Card, PageTitle, Table, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteMenuAction, saveMenuAction } from "@/modules/menus/actions";
import { listMenus } from "@/modules/menus/repository";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { ADMIN_ICON_NAMES } from "../sidebar";

export default async function MenusPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const me = await requirePermissionPage("menu.read");
  const { edit } = await searchParams;
  const menus = await listMenus();
  const editing = edit ? menus.find((m) => m.id === edit) : undefined;
  const canWrite = can(me, editing ? "menu.update" : "menu.create");
  const groups = menus.filter((m) => m.scope === "ADMIN" && !m.parentId && m.path === "#");
  const parentLabel = new Map(menus.map((m) => [m.id, m.label]));

  return (
    <>
      <PageTitle sub="ADMIN = sidebar panel (tampil sesuai permission) · PUBLIC = navigasi & section di halaman portofolio">Menu Dinamis</PageTitle>
      {canWrite && (
        <Card title={editing ? `Edit: ${editing.label}` : "Tambah menu"} right={editing && <Link href="/admin/menus" className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveMenuAction} className="space-y-4" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="label">Scope</label>
                <select name="scope" defaultValue={editing?.scope ?? "ADMIN"} className="input-dark"><option value="ADMIN">ADMIN — sidebar</option><option value="PUBLIC">PUBLIC — nav & section</option></select></div>
              <div><label className="label">Label *</label><input name="label" required defaultValue={editing?.label} className="input-dark" /></div>
              <div><label className="label">Path *</label><input name="path" required defaultValue={editing?.path} placeholder="/admin/… | #section | # (grup)" className="input-dark" /></div>
              <div><label className="label">Ikon (ADMIN)</label>
                <select name="icon" defaultValue={editing?.icon ?? "LayoutDashboard"} className="input-dark">{ADMIN_ICON_NAMES.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
              <div><label className="label">Permission (ADMIN)</label>
                <select name="permissionKey" defaultValue={editing?.permissionKey ?? ""} className="input-dark"><option value="">— cukup login —</option>{PERMISSIONS.map((p) => <option key={p.key} value={p.key}>{p.key}</option>)}</select></div>
              <div><label className="label">Induk / grup (ADMIN)</label>
                <select name="parentId" defaultValue={editing?.parentId ?? ""} className="input-dark"><option value="">— tingkat atas —</option>{groups.filter((g) => g.id !== editing?.id).map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select></div>
              <div><label className="label">Urutan</label><input name="sortOrder" type="number" min={0} defaultValue={editing?.sortOrder ?? 0} className="input-dark" /></div>
              <label className="flex items-center gap-2 pt-6 text-sm text-slate-300"><input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="accent-violet-500" /> Aktif</label>
            </div>
            <p className="text-xs text-slate-500">Section publik yang tersedia: #tentang, #biodata, #pengalaman, #skill, #sertifikasi, #proyek, #kontak. Nonaktifkan menu PUBLIC → section-nya hilang dari situs.</p>
            <button className="btn-primary">{editing ? "Simpan" : "Tambah"}</button>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Scope</th><th className={th}>Label</th><th className={th}>Path</th><th className={th}>Permission</th><th className={th}>Urut</th><th className={th}>Aktif</th><th className={th} /></tr></thead>
          <tbody>
            {menus.map((m) => (
              <tr key={m.id} className="hover:bg-white/5">
                <td className={td}><Badge tone={m.scope === "PUBLIC" ? "cyan" : "violet"}>{m.scope}</Badge></td>
                <td className={td}>{m.parentId && <span className="text-slate-500">{parentLabel.get(m.parentId)} › </span>}{m.label}</td>
                <td className={`${td} font-mono text-xs`}>{m.path}</td>
                <td className={`${td} text-xs text-slate-400`}>{m.permissionKey ?? "—"}</td>
                <td className={td}>{m.sortOrder}</td>
                <td className={td}>{m.isActive ? "✔" : "✘"}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(me, "menu.update") && <Link href={`/admin/menus?edit=${m.id}`} className="btn-ghost btn-sm">Edit</Link>}
                    {can(me, "menu.delete") && <form action={deleteMenuAction}><input type="hidden" name="id" value={m.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
