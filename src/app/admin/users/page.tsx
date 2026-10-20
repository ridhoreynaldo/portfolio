import Link from "next/link";
import { Badge, Card, PageTitle, Table, td, th, fmtDateTime } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { listRoles } from "@/modules/rbac/repository";
import { deleteUserAction, saveUserAction } from "@/modules/users/actions";
import { listUsers } from "@/modules/users/repository";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const me = await requirePermissionPage("user.read");
  const { edit } = await searchParams;
  const [users, roles] = await Promise.all([listUsers(), listRoles()]);
  const editing = edit ? users.find((u) => u.id === edit) : undefined;
  const canWrite = can(me, editing ? "user.update" : "user.create");
  const editingRoleIds = new Set(editing?.roles.map((r) => r.id));
  // non-super tidak bisa memberi role sistem → opsi disembunyikan
  const assignable = roles.filter((r) => me.isSuper || !r.isSystem);

  return (
    <>
      <PageTitle sub="Satu user bisa punya beberapa role; hak akses = gabungan permission semua role">Pengguna</PageTitle>
      {canWrite && (
        <Card title={editing ? `Edit: ${editing.email}` : "Tambah pengguna"} right={editing && <Link href="/admin/users" className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveUserAction} className="space-y-4" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">Nama *</label><input name="name" required minLength={2} defaultValue={editing?.name} className="input-dark" /></div>
              <div><label className="label">Email *</label><input name="email" type="email" required defaultValue={editing?.email} className="input-dark" /></div>
              <div><label className="label">Password {editing ? "(kosongkan jika tidak diubah)" : "*"}</label><input name="password" type="password" minLength={8} required={!editing} autoComplete="new-password" className="input-dark" /></div>
            </div>
            <div>
              <p className="label">Role</p>
              <div className="flex flex-wrap gap-3">
                {assignable.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300">
                    <input type="checkbox" name="roleIds" value={r.id} defaultChecked={editingRoleIds.has(r.id)} disabled={editing?.id === me.id} className="accent-violet-500" />
                    {r.name}{r.isSystem && " 🔒"}
                  </label>
                ))}
              </div>
              {editing?.id === me.id && <p className="mt-1 text-xs text-slate-500">Role akun sendiri tidak bisa diubah.</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} disabled={editing?.id === me.id} className="accent-violet-500" /> Aktif</label>
            {editing?.id === me.id && <input type="hidden" name="isActive" value="on" />}
            {editing?.id === me.id && editing.roles.map((r) => <input key={r.id} type="hidden" name="roleIds" value={r.id} />)}
            <button className="btn-primary">{editing ? "Simpan" : "Tambah"}</button>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Nama</th><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>Login terakhir</th><th className={th} /></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-white/5 ${u.isActive ? "" : "opacity-50"}`}>
                <td className={td}>{u.name}{u.id === me.id && <span className="ml-1 text-xs text-slate-500">(Anda)</span>}</td>
                <td className={td}>{u.email}</td>
                <td className={td}><div className="flex flex-wrap gap-1">{u.roles.map((r) => <Badge key={r.id} tone={r.isSystem ? "violet" : "cyan"}>{r.name}</Badge>)}</div></td>
                <td className={td}>{u.isActive ? <Badge tone="emerald">aktif</Badge> : <Badge tone="rose">nonaktif</Badge>}</td>
                <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(u.lastLoginAt)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(me, "user.update") && (me.isSuper || !u.roles.some((r) => r.isSystem)) && <Link href={`/admin/users?edit=${u.id}`} className="btn-ghost btn-sm">Edit</Link>}
                    {can(me, "user.delete") && u.id !== me.id && (me.isSuper || !u.roles.some((r) => r.isSystem)) && (
                      <form action={deleteUserAction}><input type="hidden" name="id" value={u.id} /><button className="btn-danger btn-sm">Hapus</button></form>
                    )}
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
