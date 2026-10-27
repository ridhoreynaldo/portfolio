import Link from "next/link";
import { CalendarClock, Globe, Receipt, Server } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, INVOICE_STATUS, ORDER_STATUS, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { lastPaidPeriods, listOrders, openInvoiceByOrder, orderTotal, type OrderRow } from "@/modules/billing/repository";
import { Badge, Table, fmtDate, fmtDateTime, td, th } from "@/shared/ui";

export const metadata = { title: "Langganan Saya" };

/** Sisa waktu sampai tanggal (YYYY-MM-DD) dalam bulan/hari yang mudah dibaca. */
function remaining(end: string) {
  const ms = new Date(end + "T00:00:00").getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (days < 0) return { text: `lewat ${Math.abs(days)} hari`, tone: "rose" as const };
  if (days <= 30) return { text: `${days} hari lagi`, tone: "amber" as const };
  const months = Math.round(days / 30.4);
  return { text: `${months} bulan lagi`, tone: "emerald" as const };
}

function SubscriptionCard({ o, paidUntil, open }: { o: OrderRow; paidUntil?: string; open?: { id: string; period: string; amount: number; status: "unpaid" | "pending_verification" | "paid" | "cancelled" } }) {
  const total = orderTotal(o);
  const cycle = o.billingCycle ?? "once";
  const rem = o.endDate ? remaining(o.endDate) : null;
  const Icon = /domain/i.test(o.packageName) ? Globe : Server;
  return (
    <article className="hud flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-cyan-300/40 bg-cyan-400/10 text-cyan-200"><Icon className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-base font-bold text-white">{o.packageName}{o.quantity > 1 && <span className="text-slate-400"> ×{o.quantity}</span>}</h2>
            <p className="font-mono text-[11px] text-cyan-300/80">{o.number}</p>
          </div>
        </div>
        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="hud-label !text-[10px]">Biaya</dt><dd className="font-semibold text-white">{total > 0 ? fmtIDR(total) : "sesuai kesepakatan"}</dd><dd className="text-xs text-slate-500">{CYCLE[cycle]}</dd></div>
        <div><dt className="hud-label !text-[10px]">Mulai</dt><dd className="text-slate-200">{o.startDate ? fmtDate(o.startDate) : "—"}</dd></div>
        {o.endDate ? (
          <div><dt className="hud-label !text-[10px]">Berlaku s.d.</dt><dd className="text-slate-200">{fmtDate(o.endDate)}</dd>{rem && <dd><Badge tone={rem.tone}>{rem.text}</Badge></dd>}</div>
        ) : cycle === "monthly" ? (
          <div><dt className="hud-label !text-[10px]">Pembayaran</dt><dd className="text-slate-200">{paidUntil ? `lunas s.d. ${fmtPeriod(paidUntil)}` : "belum ada pembayaran"}</dd></div>
        ) : null}
        {(o.items.length > 0 || o.itemLimit != null) && (
          <div><dt className="hud-label !text-[10px]">Kuota {o.itemLabel || "item"}</dt><dd className="text-slate-200">{o.items.length}{o.itemLimit != null && ` / ${o.itemLimit}`} terpakai</dd>
            {o.itemLimit != null && <dd className="bar-track mt-1"><div className="bar-fill" style={{ width: `${Math.min(100, (o.items.length / Math.max(1, o.itemLimit)) * 100)}%` }} /></dd>}
          </div>
        )}
      </dl>

      {o.items.length > 0 && (
        <div>
          <p className="hud-label mb-2 !text-[10px]">{o.itemLabel || "item"} yang dicakup</p>
          <ul className="flex flex-wrap gap-1.5">{o.items.map((it) => <li key={it} className="chip font-mono text-[11px]">{it}</li>)}</ul>
        </div>
      )}
      {o.adminNote && <p className="whitespace-pre-line border-l-2 border-cyan-400/50 pl-3 text-xs text-cyan-100/90">{o.adminNote}</p>}

      {open ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3 text-sm">
          <span className="text-slate-300"><CalendarClock className="mr-1 inline h-4 w-4 text-amber-300" />Tagihan {open.period ? fmtPeriod(open.period) : "berjalan"}: <b className="text-white">{fmtIDR(open.amount)}</b> · <Badge tone={INVOICE_STATUS[open.status].tone}>{INVOICE_STATUS[open.status].label}</Badge></span>
          <Link href={`/portal/invoices/${open.id}`} className="btn-primary btn-sm"><Receipt className="h-3.5 w-3.5" /> {open.status === "unpaid" ? "Bayar via QRIS" : "Lihat tagihan"}</Link>
        </div>
      ) : null}
    </article>
  );
}

export default async function PortalOrders() {
  const user = await requireUser("/portal/orders");
  const [orders, paid, open] = await Promise.all([listOrders({ userId: user.id }), lastPaidPeriods(user.id), openInvoiceByOrder(user.id)]);
  const active = orders.filter((o) => o.status === "active");
  const others = orders.filter((o) => o.status !== "active");
  return (
    <>
      <p className="hud-label mb-1">// layanan yang Anda sewa</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-black tracking-wide">Langganan <span className="text-gradient">Saya</span></h1>
        <Link href="/jasa#paket" className="btn-primary btn-sm">+ Sewa / pesan layanan</Link>
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {active.map((o) => <SubscriptionCard key={o.id} o={o} paidUntil={paid[o.id]} open={open[o.id]} />)}
        {!active.length && <p className="hud p-6 text-sm text-slate-400 lg:col-span-2">Belum ada langganan aktif. Pesanan yang sudah dikonfirmasi akan tampil di sini. <Link href="/jasa#paket" className="text-cyan-300 hover:underline">Lihat paket jasa →</Link></p>}
      </section>

      {others.length > 0 && (
        <section className="mt-8">
          <p className="hud-label mb-3">// pesanan lain & riwayat</p>
          <div className="hud p-0">
            <Table>
              <thead><tr><th className={th}>Nomor</th><th className={th}>Paket</th><th className={th}>Harga</th><th className={th}>Status</th><th className={th}>Dibuat</th></tr></thead>
              <tbody>
                {others.map((o) => (
                  <tr key={o.id} className="align-top hover:bg-white/5">
                    <td className={`${td} font-mono text-xs text-cyan-300`}>{o.number}</td>
                    <td className={td}>
                      <div className="font-medium text-white">{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`}</div>
                      {o.notes && <div className="mt-1 max-w-md whitespace-pre-line text-xs text-slate-500">{o.notes}</div>}
                      {o.adminNote && <div className="mt-2 border-l-2 border-cyan-400/50 pl-2 text-xs text-cyan-200"><span className="hud-label !text-[9px]">catatan admin</span><br />{o.adminNote}</div>}
                    </td>
                    <td className={td}>{orderTotal(o) > 0 ? <>{fmtIDR(orderTotal(o))}<div className="text-xs text-slate-500">{CYCLE[o.billingCycle ?? "once"]}</div></> : "sesuai kesepakatan"}</td>
                    <td className={td}><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                    <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </section>
      )}
    </>
  );
}
