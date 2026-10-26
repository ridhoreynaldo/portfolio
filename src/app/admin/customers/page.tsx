import Link from "next/link";
import { Badge, Card, PageTitle, Table, fmtDateTime, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { saveCustomerAction } from "@/modules/billing/actions";
import { fmtIDR } from "@/modules/billing/labels";
import { listCustomers } from "@/modules/billing/repository";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requirePermissionPage("customer.read");
  const { edit } = await searchParams;
  const rows = await listCustomers();
  const c = edit ? rows.find((r) => r.id === edit) : undefined;
  const canWrite = can(user, `customer.${c ? "update" : "create"}`);

  return (
    <>
      <PageTitle sub="Akun pelanggan (role customer). Pelanggan juga bisa mendaftar sendiri di /register. Hapus akun lewat menu Pengguna.">Pelanggan</PageTitle>
      {canWrite && (
        <Card title={c ? `Edit: ${c.email}` : "Buat akun pelanggan"} right={c && <Link href="/admin/customers" className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveCustomerAction} className="space-y-4" key={c?.id ?? "new"}>
            {c && <input type="hidden" name="id" value={c.id} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="label">Nama *</label><input name="name" required minLength={2} maxLength={80} defaultValue={c?.name} className="input-dark" /></div>
              <div><label className="label">Email *</label><input name="email" type="email" required defaultValue={c?.email} className="input-dark" /></div>
              <div><label className="label">Password {c ? "(kosongkan jika tetap)" : "*"}</label><input name="password" type="password" minLength={8} required={!c} autoComplete="new-password" className="input-dark" /></div>
              <div><label className="label">WhatsApp</label><input name="phone" maxLength={64} defaultValue={c?.phone} className="input-dark" /></div>
              <div><label className="label">Instansi / usaha</label><input name="company" maxLength={128} defaultValue={c?.company} className="input-dark" /></div>
              <label className="flex items-center gap-2 pt-6 text-sm text-slate-300"><input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} className="accent-cyan-400" /> Aktif</label>
              <div className="sm:col-span-2"><label className="label">Alamat</label><textarea name="address" rows={2} maxLength={1000} defaultValue={c?.address} className="input-dark" /></div>
              <div><label className="label">Catatan internal</label><textarea name="notes" rows={2} maxLength={2000} defaultValue={c?.notes} className="input-dark" /></div>
            </div>
            <button className="btn-primary">{c ? "Simpan" : "Buat akun"}</button>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Pelanggan</th><th className={th}>Kontak</th><th className={th}>Order</th><th className={th}>Tagihan terbuka</th><th className={th}>Login terakhir</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`hover:bg-white/5 ${r.isActive ? "" : "opacity-50"}`}>
                <td className={td}><div className="text-white">{r.name}</div><div className="text-xs text-slate-500">{r.email}{r.company && ` · ${r.company}`}</div></td>
                <td className={`${td} text-xs text-slate-300`}>{r.phone || "—"}</td>
                <td className={td}><Link href="/admin/orders" className="text-cyan-300 hover:underline">{r.orderCount}</Link></td>
                <td className={td}>{r.unpaidCount ? <Badge tone="amber">{r.unpaidCount} · {fmtIDR(r.unpaidTotal)}</Badge> : <Badge tone="emerald">lunas</Badge>}</td>
                <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(r.lastLoginAt)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, "customer.update") && <Link href={`/admin/customers?edit=${r.id}`} className="btn-ghost btn-sm">Edit</Link>}
                    {can(user, "invoice.create") && <Link href={`/admin/invoices?new=1&userId=${r.id}`} className="btn-magenta btn-sm">+ Tagihan</Link>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={6}>Belum ada pelanggan.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
