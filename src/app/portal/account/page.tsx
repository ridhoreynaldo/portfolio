import { changePasswordAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";
import { updateMyProfileAction } from "@/modules/billing/customer-actions";
import { getCustomerProfile } from "@/modules/billing/repository";

export const metadata = { title: "Akun Saya" };

export default async function PortalAccount() {
  const user = await requireUser("/portal/account");
  const cp = await getCustomerProfile(user.id);
  return (
    <>
      <p className="hud-label mb-1">// akun</p>
      <h1 className="font-display text-2xl font-black tracking-wide">Data <span className="text-gradient">Akun</span></h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <form action={updateMyProfileAction} className="hud space-y-4 p-6">
          <h2 className="font-display font-bold text-white">Profil</h2>
          <div><label className="label" htmlFor="email">Email (login)</label><input id="email" value={user.email} disabled className="input-dark" /></div>
          <div><label className="label" htmlFor="name">Nama *</label><input id="name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} className="input-dark" /></div>
          <div><label className="label" htmlFor="phone">WhatsApp</label><input id="phone" name="phone" defaultValue={cp?.phone ?? ""} className="input-dark" /></div>
          <div><label className="label" htmlFor="company">Instansi / usaha</label><input id="company" name="company" maxLength={128} defaultValue={cp?.company ?? ""} className="input-dark" /></div>
          <div><label className="label" htmlFor="address">Alamat</label><textarea id="address" name="address" rows={3} maxLength={1000} defaultValue={cp?.address ?? ""} className="input-dark" /></div>
          <button className="btn-primary">Simpan</button>
        </form>
        <form action={changePasswordAction} className="hud h-fit space-y-4 p-6">
          <h2 className="font-display font-bold text-white">Ganti password</h2>
          <div><label className="label" htmlFor="current">Password lama</label><input id="current" name="current" type="password" required autoComplete="current-password" className="input-dark" /></div>
          <div><label className="label" htmlFor="next">Password baru</label><input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input-dark" /></div>
          <div><label className="label" htmlFor="confirm">Ulangi password baru</label><input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input-dark" /></div>
          <p className="text-xs text-slate-500">Setelah diganti, Anda diminta login ulang.</p>
          <button className="btn-ghost">Ganti password</button>
        </form>
      </div>
    </>
  );
}
