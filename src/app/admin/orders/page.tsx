import Link from "next/link";
import { Badge, Card, PageTitle, Table, fmtDateTime, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteOrderAction, updateOrderAction } from "@/modules/billing/actions";
import { CYCLE, ORDER_STATUS, currentPeriod, fmtIDR } from "@/modules/billing/labels";
import { listOrders } from "@/modules/billing/repository";
import { orderStatus } from "@/modules/billing/schema";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ edit?: string; status?: string }> }) {
  const user = await requirePermissionPage("order.read");
  const { edit, status } = await searchParams;
  const all = await listOrders();
  const rows = status && status in ORDER_STATUS ? all.filter((o) => o.status === status) : all;
  const o = edit ? all.find((r) => r.id === edit) : undefined;

  return (
    <>
      <PageTitle sub="Pesanan dari portal pelanggan. Konfirmasi → ubah status Aktif, lalu buat tagihan (sekali / bulanan).">Order</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/orders" className={`btn-ghost btn-sm ${!status ? "!border-cyan-400" : ""}`}>Semua ({all.length})</Link>
        {orderStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`btn-ghost btn-sm ${status === s ? "!border-cyan-400" : ""}`}>{ORDER_STATUS[s].label} ({all.filter((x) => x.status === s).length})</Link>
        ))}
      </div>
      {o && can(user, "order.update") && (
        <Card title={`Proses order ${o.number} — ${o.customerName}`} right={<Link href="/admin/orders" className="btn-ghost btn-sm">Tutup</Link>}>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="label">Paket</span>{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`} · {o.price != null && o.price > 0 ? `${fmtIDR(o.price * o.quantity)} ${CYCLE[o.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}</div>
            <div><span className="label">Pelanggan</span>{o.customerName} · {o.customerEmail}</div>
            <div className="sm:col-span-2"><span className="label">Brief pelanggan</span><p className="whitespace-pre-line text-slate-300">{o.notes || "—"}</p></div>
          </div>
          <form action={updateOrderAction} className="space-y-4" key={o.id}>
            <input type="hidden" name="id" value={o.id} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="label">Status</label><select name="status" defaultValue={o.status} className="input-dark">{orderStatus.enumValues.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}</select></div>
              <div><label className="label">Tanggal mulai layanan</label><input name="startDate" type="date" defaultValue={o.startDate ?? ""} className="input-dark" /></div>
              <div className="sm:col-span-3"><label className="label">Catatan untuk pelanggan (tampil di portal)</label><textarea name="adminNote" rows={3} maxLength={2000} defaultValue={o.adminNote} className="input-dark" /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary">Simpan</button>
              {can(user, "invoice.create") && (
                <Link
                  href={`/admin/invoices?new=1&userId=${o.userId}&orderId=${o.id}&title=${encodeURIComponent(`${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""} — ${o.number}`)}&amount=${(o.price ?? 0) * o.quantity}&period=${o.billingCycle === "monthly" ? currentPeriod() : ""}`}
                  className="btn-magenta"
                >
                  Buat tagihan untuk order ini →
                </Link>
              )}
            </div>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Nomor</th><th className={th}>Pelanggan</th><th className={th}>Paket</th><th className={th}>Status</th><th className={th}>Dibuat</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className={`${td} font-mono text-xs text-cyan-300`}>{r.number}</td>
                <td className={td}><div className="text-white">{r.customerName}</div><div className="text-xs text-slate-500">{r.customerEmail}</div></td>
                <td className={td}>{r.packageName}{r.quantity > 1 && ` ×${r.quantity}`}<div className="text-xs text-slate-500">{r.price != null && r.price > 0 ? `${fmtIDR(r.price * r.quantity)} ${CYCLE[r.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}</div></td>
                <td className={td}><Badge tone={ORDER_STATUS[r.status].tone}>{ORDER_STATUS[r.status].label}</Badge></td>
                <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(r.createdAt)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, "order.update") && <Link href={`/admin/orders?edit=${r.id}`} className="btn-ghost btn-sm">Proses</Link>}
                    {can(user, "order.delete") && <form action={deleteOrderAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={6}>Belum ada order.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
