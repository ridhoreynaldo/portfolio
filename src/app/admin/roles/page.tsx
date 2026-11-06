import Link from "next/link";
import { Modal } from "@/components/lc/modal";
import { Badge, Card, PageTitle, Table, td, th } from "@/components/lc/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteRoleAction, saveRoleAction } from "@/modules/rbac/actions";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { listRoles, rolePermissionKeys } from "@/modules/rbac/repository";

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const me = await requirePermissionPage("role.read");
  const { edit, new: isNew } = await searchParams;
  const roles = await listRoles();
  const editing = edit ? roles.find((r) => r.id === edit) : undefined;
  const granted = new Set(editing ? await rolePermissionKeys(editing.id) : []);
  const canWrite = can(me, editing ? "role.update" : "role.create");
  const modules = PERMISSIONS.reduce<Record<string, typeof PERMISSIONS>>((acc, p) => ((acc[p.module] ??= []).push(p), acc), {});
  const grantable = (key: string) => me.isSuper || me.permissions.includes(key);

  return (
    <>
      <PageTitle actions={can(me, "role.create") ? <Link href="/admin/roles?new=1" scroll={false} className="btn-primary btn-sm">+ Tambah role</Link> : undefined} sub="Permission dibaca dari DB tiap request — perubahan berlaku langsung tanpa login ulang">Role & Hak Akses</PageTitle>
      {canWrite && (editing || isNew === "1") && (
        <Modal title={editing ? `Edit role: ${editing.name}` : "Tambah role"} close="/admin/roles">
          <form action={saveRoleAction} className="space-y-5" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Nama * (huruf kecil, mis. content_editor)</label><input name="name" required pattern="[a-z][a-z0-9_]{1,63}" defaultValue={editing?.name} readOnly={editing?.isSystem} className="input-dark" /></div>
              <div><label className="label">Deskripsi</label><input name="description" defaultValue={editing?.description ?? ""} className="input-dark" /></div>
            </div>
            {editing?.isSystem ? (
              <p className="text-sm text-amber-200">Role sistem memiliki akses penuh ke seluruh fitur dan tidak dapat dibatasi.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(modules).map(([mod, list]) => (
                  <fieldset key={mod} className="rounded-xl border border-[var(--line)] p-3">
                    <legend className="px-1 text-[11px] uppercase tracking-wider text-[var(--brand-ink)]">{mod}</legend>
                    {list.map((p) => (
                      <label key={p.key} className={`flex items-center gap-2 py-0.5 text-sm ${grantable(p.key) ? "text-[var(--ink-2)]" : "text-[var(--ink-3)]"}`} title={grantable(p.key) ? "" : "Anda tidak memiliki permission ini"}>
                        <input type="checkbox" name="permissions" value={p.key} defaultChecked={granted.has(p.key)} disabled={!grantable(p.key)} className="accent-violet-500" />
                        {p.key.split(".")[1]}
                      </label>
                    ))}
                  </fieldset>
                ))}
              </div>
            )}
            <button className="btn-primary">{editing ? "Simpan" : "Buat role"}</button>
          </form>
        </Modal>
      )}
      <Card flush>
        <Table>
          <thead><tr><th className={th}>Role</th><th className={th}>Deskripsi</th><th className={th}>Permission</th><th className={th}>User</th><th className={th} /></tr></thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--surface-2)]">
                <td className={td}><Badge tone={r.isSystem ? "violet" : "cyan"}>{r.name}</Badge>{r.isSystem && " 🔒"}</td>
                <td className={`${td} text-[var(--ink-3)]`}>{r.description}</td>
                <td className={td}>{r.isSystem ? "semua" : r.permissionCount}</td>
                <td className={td}>{r.userCount}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(me, "role.update") && (me.isSuper || !r.isSystem) && <Link href={`/admin/roles?edit=${r.id}`} scroll={false} className="btn-ghost btn-sm">Edit</Link>}
                    {can(me, "role.delete") && !r.isSystem && r.userCount === 0 && <form action={deleteRoleAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
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
