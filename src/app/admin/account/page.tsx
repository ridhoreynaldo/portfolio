import { Badge, Card, PageTitle } from "@/shared/ui";
import { changePasswordAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";

export default async function AccountPage() {
  const me = await requireUser();
  return (
    <>
      <PageTitle sub={me.email}>Akun Saya</PageTitle>
      <Card title="Role & hak akses">
        <div className="flex flex-wrap gap-1">{me.roles.map((r) => <Badge key={r.id} tone={r.isSystem ? "violet" : "cyan"}>{r.name}</Badge>)}</div>
        <p className="mt-3 text-xs text-slate-500">{me.isSuper ? "Akses penuh (role sistem)." : `${me.permissions.length} permission: ${me.permissions.join(", ") || "—"}`}</p>
      </Card>
      <Card title="Ganti password">
        <form action={changePasswordAction} className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Password lama</label><input name="current" type="password" required autoComplete="current-password" className="input-dark" /></div>
          <div><label className="label">Password baru (min 8)</label><input name="next" type="password" required minLength={8} autoComplete="new-password" className="input-dark" /></div>
          <div><label className="label">Konfirmasi</label><input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input-dark" /></div>
          <div className="sm:col-span-3"><button className="btn-primary">Ubah password</button><p className="mt-2 text-xs text-slate-500">Semua sesi akan dicabut dan Anda perlu login ulang.</p></div>
        </form>
      </Card>
    </>
  );
}
