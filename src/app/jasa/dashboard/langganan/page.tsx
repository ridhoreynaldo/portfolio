import Link from "next/link";
import { CalendarClock, Globe, Receipt, Server } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, INVOICE_STATUS, ORDER_STATUS, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { lastPaidPeriods, listOrders, openInvoiceByOrder, orderTotal, type OrderRow } from "@/modules/billing/repository";
import { fmtDate, fmtDateTime } from "@/shared/ui";
import { Pill, PortalTitle, ptd, pth, type Tone } from "../ui";

export const metadata = { title: "Langganan Saya" };

/** Sisa waktu sampai tanggal (YYYY-MM-DD) dalam bulan/hari yang mudah dibaca. */
function remaining(end: string): { text: string; tone: Tone } {
  const ms = new Date(end + "T00:00:00").getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (days < 0) return { text: `lewat ${Math.abs(days)} hari`, tone: "rose" };
  if (days <= 30) return { text: `${days} hari lagi`, tone: "amber" };
  return { text: `${Math.round(days / 30.4)} bulan lagi`, tone: "emerald" };
}

type OpenInv = { id: string; period: string; amount: number; status: "unpaid" | "pending_verification" | "paid" | "cancelled"; dueDate: string };

function SubscriptionCard({ o, paidUntil, open }: { o: OrderRow; paidUntil?: string; open?: OpenInv }) {
  const total = orderTotal(o);
  const cycle = o.billingCycle ?? "once";
  const rem = o.endDate ? remaining(o.endDate) : null;
  const Icon = /domain/i.test(o.packageName) ? Globe : Server;
  const label = o.itemLabel || "item";
  return (
    <article className="card flex flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><Icon className="h-5 w-5" /></span>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[var(--navy)]">{o.packageName}{o.quantity > 1 && <span className="text-[var(--ink-3)]"> ×{o.quantity}</span>}</h2>
            <p className="font-mono text-[11px] text-[var(--ink-3)]">{o.number}</p>
          </div>
        </div>
        <Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Biaya</dt><dd className="font-semibold text-[var(--navy)]">{total > 0 ? fmtIDR(total) : "sesuai kesepakatan"}</dd><dd className="text-xs text-[var(--ink-3)]">{CYCLE[cycle]}</dd></div>
        <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Mulai</dt><dd className="text-[var(--ink)]">{o.startDate ? fmtDate(o.startDate) : "—"}</dd></div>
        {o.endDate ? (
          <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Berlaku s.d.</dt><dd className="text-[var(--ink)]">{fmtDate(o.endDate)}</dd>{rem && <dd className="mt-1"><Pill tone={rem.tone}>{rem.text}</Pill></dd>}</div>
        ) : cycle === "monthly" ? (
          <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Pembayaran</dt><dd className="text-[var(--ink)]">{paidUntil ? `lunas s.d. ${fmtPeriod(paidUntil)}` : "belum ada pembayaran"}</dd>{open && <dd className="text-xs text-[var(--ink-3)]">tagihan berikutnya {fmtDate(open.dueDate)}</dd>}</div>
        ) : null}
        {o.endDate && cycle !== "monthly" && <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Tagihan berikutnya</dt><dd className="text-[var(--ink)]">{fmtDate(o.endDate)}</dd><dd className="text-xs text-[var(--ink-3)]">perpanjangan {CYCLE[cycle]}</dd></div>}
        {(o.items.length > 0 || o.itemLimit != null) && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Kuota {label}</dt>
            <dd className="text-[var(--ink)]">{o.items.length}{o.itemLimit != null && ` / ${o.itemLimit}`} terpakai</dd>
            {o.itemLimit != null && <dd className="meter mt-1.5"><span style={{ width: `${Math.min(100, (o.items.length / Math.max(1, o.itemLimit)) * 100)}%` }} /></dd>}
          </div>
        )}
      </dl>

      {o.breakdown.length > 0 && (
        <ul className="divide-y divide-[var(--rule)] rounded-xl border border-[var(--rule)] bg-white/60 text-sm">
          {o.breakdown.map((b, k) => <li key={k} className="flex justify-between px-4 py-2"><span className="text-[var(--ink)]">{b.description}</span><span className="text-[var(--ink-2)]">{fmtIDR(b.amount)}</span></li>)}
        </ul>
      )}
      {o.items.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label} yang dicakup</p>
          <ul className="flex flex-wrap gap-1.5">{o.items.map((it) => <li key={it} className="tag font-mono !font-medium">{it}</li>)}</ul>
        </div>
      )}
      {o.adminNote && <p className="whitespace-pre-line border-l-2 border-[var(--gold)] pl-3 text-sm text-[var(--ink-2)]">{o.adminNote}</p>}

      {open && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] pt-4 text-sm">
          <span className="text-[var(--ink-2)]"><CalendarClock className="mr-1 inline h-4 w-4 text-[var(--gold)]" />Tagihan {open.period ? fmtPeriod(open.period) : "berjalan"}: <b className="text-[var(--navy)]">{fmtIDR(open.amount)}</b> · <Pill tone={INVOICE_STATUS[open.status].tone}>{INVOICE_STATUS[open.status].label}</Pill></span>
          <Link href={`/jasa/dashboard/tagihan/${open.id}`} className={`${open.status === "unpaid" ? "btn-gold" : "btn-ghost"} btn-sm`}><Receipt className="h-3.5 w-3.5" /> {open.status === "unpaid" ? "Bayar via QRIS" : "Lihat tagihan"}</Link>
        </div>
      )}
    </article>
  );
}

export default async function PortalOrders() {
  const user = await requireUser("/jasa/dashboard/langganan");
  const [orders, paid, open] = await Promise.all([listOrders({ userId: user.id }), lastPaidPeriods(user.id), openInvoiceByOrder(user.id)]);
  const active = orders.filter((o) => o.status === "active");
  const others = orders.filter((o) => o.status !== "active");
  return (
    <>
      <PortalTitle eyebrow="Layanan yang Anda sewa" title="Langganan Saya" right={<Link href="/jasa#paket" className="btn-primary btn-sm">+ Sewa / pesan layanan</Link>} />

      <section className="grid gap-5 lg:grid-cols-2">
        {active.map((o) => <SubscriptionCard key={o.id} o={o} paidUntil={paid[o.id]} open={open[o.id]} />)}
        {!active.length && <p className="card p-6 text-sm text-[var(--ink-2)] lg:col-span-2">Belum ada langganan aktif. Pesanan yang sudah dikonfirmasi akan tampil di sini. <Link href="/jasa#paket" className="font-semibold text-[var(--navy)] hover:underline">Lihat paket jasa →</Link></p>}
      </section>

      {others.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow mb-3">Pesanan lain & riwayat</p>
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f3eee4]"><tr><th className={pth}>Nomor</th><th className={pth}>Paket</th><th className={pth}>Harga</th><th className={pth}>Status</th><th className={pth}>Dibuat</th></tr></thead>
                <tbody>
                  {others.map((o) => (
                    <tr key={o.id} className="hover:bg-white">
                      <td className={`${ptd} font-mono text-xs text-[var(--navy-2)]`}>{o.number}</td>
                      <td className={ptd}>
                        <div className="font-medium text-[var(--ink)]">{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`}</div>
                        {o.notes && <div className="mt-1 max-w-md whitespace-pre-line text-xs text-[var(--ink-3)]">{o.notes}</div>}
                        {o.adminNote && <div className="mt-2 border-l-2 border-[var(--gold)] pl-2 text-xs text-[var(--ink-2)]"><span className="font-semibold uppercase tracking-wider text-[10px] text-[var(--ink-3)]">catatan admin</span><br />{o.adminNote}</div>}
                      </td>
                      <td className={ptd}>{orderTotal(o) > 0 ? <>{fmtIDR(orderTotal(o))}<div className="text-xs text-[var(--ink-3)]">{CYCLE[o.billingCycle ?? "once"]}</div></> : "sesuai kesepakatan"}</td>
                      <td className={ptd}><Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill></td>
                      <td className={`${ptd} text-xs text-[var(--ink-3)]`}>{fmtDateTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
