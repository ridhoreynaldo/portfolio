import Link from "next/link";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, ORDER_STATUS, fmtIDR } from "@/modules/billing/labels";
import { listOrders } from "@/modules/billing/repository";
import { Badge, Table, fmtDateTime, td, th } from "@/shared/ui";

export const metadata = { title: "Pesanan Saya" };

export default async function PortalOrders() {
  const user = await requireUser("/portal/orders");
  const orders = await listOrders({ userId: user.id });
  return (
    <>
      <p className="hud-label mb-1">// riwayat</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black tracking-wide">Pesanan <span className="text-gradient">Saya</span></h1>
        <Link href="/jasa#paket" className="btn-primary btn-sm">+ Pesan layanan</Link>
      </div>
      <section className="hud mt-6 p-0">
        <Table>
          <thead><tr><th className={th}>Nomor</th><th className={th}>Paket</th><th className={th}>Harga</th><th className={th}>Status</th><th className={th}>Mulai</th><th className={th}>Dibuat</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="align-top hover:bg-white/5">
                <td className={`${td} font-mono text-xs text-cyan-300`}>{o.number}</td>
                <td className={td}>
                  <div className="font-medium text-white">{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`}</div>
                  {o.notes && <div className="mt-1 max-w-md whitespace-pre-line text-xs text-slate-500">{o.notes}</div>}
                  {o.adminNote && <div className="mt-2 border-l-2 border-cyan-400/50 pl-2 text-xs text-cyan-200"><span className="hud-label !text-[9px]">catatan admin</span><br />{o.adminNote}</div>}
                </td>
                <td className={td}>{o.price != null && o.price > 0 ? <>{fmtIDR(o.price * o.quantity)}<div className="text-xs text-slate-500">{CYCLE[o.billingCycle ?? "once"]}</div></> : "sesuai kesepakatan"}</td>
                <td className={td}><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                <td className={td}>{o.startDate ?? "—"}</td>
                <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(o.createdAt)}</td>
              </tr>
            ))}
            {!orders.length && <tr><td className={td} colSpan={6}>Belum ada pesanan. <Link href="/jasa#paket" className="text-cyan-300 hover:underline">Lihat paket jasa →</Link></td></tr>}
          </tbody>
        </Table>
      </section>
    </>
  );
}
