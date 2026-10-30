import Link from "next/link";
import { Printer, QrCode } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, ORDER_STATUS, billingDayOf, daysUntil, fmtIDR, fmtPeriod, paidUntilDate } from "@/modules/billing/labels";
import { listInvoices, listOrders, orderTotal, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { fmtDate, fmtDateTime } from "@/shared/ui";
import { Pill, PortalTitle, pth, ptd, type Tone } from "./ui";

export const metadata = { title: "Langganan Saya" };

const daysText = (d: number) => (d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`);
const daysTone = (d: number): Tone => (d < 0 ? "rose" : d <= 7 ? "amber" : "emerald");

/** Satu baris tabel jasa: biaya, status bayar, jatuh tempo, dan tagihan yang sedang terbuka. */
function ServiceRow({ o, invoices, no }: { o: OrderRow; invoices: InvoiceRow[]; no: number }) {
  const cycle = o.billingCycle ?? "once";
  const total = orderTotal(o);
  const day = billingDayOf(o.startDate);
  const mine = invoices.filter((i) => i.orderId === o.id && i.status !== "cancelled").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const next = mine.find((i) => i.status !== "paid");
  const lastPaid = [...mine].reverse().find((i) => i.status === "paid");
  const paidUntil = cycle === "monthly" ? (lastPaid?.period ? paidUntilDate(lastPaid.period, day) : null) : cycle === "yearly" ? (o.endDate ?? null) : null;
  const left = next ? daysUntil(next.dueDate) : null;
  const label = o.itemLabel || "item";

  return (
    <tr>
      <td className={`${ptd} w-10 font-mono text-[var(--ink-3)]`}>{no}</td>
      <td className={ptd}>
        <p className="font-semibold text-[var(--navy)]">{o.packageName}{o.quantity > 1 && <span className="text-[var(--ink-3)]"> ×{o.quantity}</span>}</p>
        <p className="font-mono text-[11px] text-[var(--ink-3)]">{o.number}</p>
        {o.items.length > 0 && <p className="mt-1 text-xs text-[var(--ink-2)]">{label} ({o.items.length}{o.itemLimit != null && `/${o.itemLimit}`}): {o.items.join(", ")}</p>}
      </td>
      <td className={`${ptd} whitespace-nowrap`}>
        <p className="font-semibold text-[var(--navy)]">{total > 0 ? fmtIDR(total) : "—"}</p>
        <p className="text-xs text-[var(--ink-3)]">{CYCLE[cycle]}</p>
      </td>
      <td className={ptd}>
        {mine.length === 0 ? <Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill>
          : next?.status === "pending_verification" ? <Pill tone="cyan">Menunggu verifikasi</Pill>
          : !next ? (
            <>
              <Pill tone="emerald">Sudah bayar</Pill>
              {lastPaid?.paidAt && <p className="mt-1 text-xs text-[var(--ink-3)]">{fmtDateTime(lastPaid.paidAt)} WIB</p>}
            </>
          ) : cycle !== "once" && left != null && left >= 0 ? (
            // langganan: selama belum jatuh tempo, periode berjalan sudah dibayar
            <>
              <Pill tone="emerald">Sudah bayar</Pill>
              {lastPaid?.paidAt && <p className="mt-1 text-xs text-[var(--ink-3)]">{fmtDateTime(lastPaid.paidAt)} WIB</p>}
            </>
          ) : (
            <>
              <Pill tone={cycle === "once" ? "amber" : "rose"}>{cycle === "once" ? "Belum bayar" : "Lewat jatuh tempo"}</Pill>
              <p className="mt-1 text-xs text-[var(--ink-2)]">{next.title}: {fmtIDR(next.amount)}</p>
            </>
          )}
      </td>
      <td className={`${ptd} whitespace-nowrap`}>
        {next ? (
          <>
            <p>{fmtDate(next.dueDate)}</p>
            {left != null && <Pill tone={daysTone(left)}>{daysText(left)}</Pill>}
          </>
        ) : cycle === "yearly" && o.endDate ? <p>{fmtDate(o.endDate)}</p> : <span className="text-[var(--ink-3)]">—</span>}
        {paidUntil && <p className="mt-1 text-xs text-[var(--ink-3)]">berlaku s.d. {fmtDate(paidUntil)}</p>}
      </td>
      <td className={`${ptd} whitespace-nowrap text-right`}>
        {next?.status === "unpaid" && (cycle === "once" || (left ?? 0) <= 7) && <Link href={`/medan/dashboard/tagihan/${next.id}`} className="btn-gold btn-sm"><QrCode className="h-3.5 w-3.5" /> Bayar</Link>}
      </td>
    </tr>
  );
}

export default async function Dashboard() {
  const user = await requireUser("/medan/dashboard");
  const [orders, invoices] = await Promise.all([listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const shown = orders.filter((o) => o.status === "active" || o.status === "pending");
  const orderName = new Map(orders.map((o) => [o.id, o.packageName]));
  const recurring = new Set(orders.filter((o) => (o.billingCycle ?? "once") !== "once").map((o) => o.id));
  const history = invoices.filter((i) => i.status !== "cancelled").sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title="Jasa yang Anda Sewa" right={<Link href="/medan#paket" className="btn-primary btn-sm">+ Sewa / pesan layanan</Link>} />

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead className="bg-[#f3eee4]">
              <tr>
                <th className={pth}>No</th><th className={pth}>Jasa</th><th className={pth}>Biaya</th>
                <th className={pth}>Status Bayar</th><th className={pth}>Jatuh Tempo</th><th className={pth} />
              </tr>
            </thead>
            <tbody>
              {shown.map((o, k) => <ServiceRow key={o.id} o={o} invoices={invoices} no={k + 1} />)}
              {!shown.length && <tr><td colSpan={6} className={`${ptd} text-[var(--ink-2)]`}>Belum ada jasa yang disewa. <Link href="/medan#paket" className="font-semibold text-[var(--navy)] hover:underline">Lihat paket →</Link></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif mb-3 text-xl font-semibold text-[var(--navy)]">Riwayat Tagihan</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead className="bg-[#f3eee4]">
                  <tr>
                    <th className={pth}>Tagihan</th><th className={pth}>Jasa / Periode</th><th className={pth}>Jumlah</th>
                    <th className={pth}>Jatuh Tempo</th><th className={pth}>Status</th><th className={pth} />
                  </tr>
                </thead>
                <tbody>
                  {history.map((i) => (
                    <tr key={i.id}>
                      <td className={`${ptd} whitespace-nowrap font-mono text-xs`}>{i.number}</td>
                      <td className={ptd}>
                        <p className="text-[var(--navy)]">{i.title}</p>
                        <p className="text-xs text-[var(--ink-3)]">{(i.orderId && orderName.get(i.orderId)) || ""}{i.period && ` · ${fmtPeriod(i.period)}`}</p>
                      </td>
                      <td className={`${ptd} whitespace-nowrap font-semibold text-[var(--navy)]`}>{fmtIDR(i.amount)}</td>
                      <td className={`${ptd} whitespace-nowrap`}>{fmtDate(i.dueDate)}</td>
                      <td className={ptd}>
                        {i.status === "paid" ? (<><Pill tone="emerald">Sudah bayar</Pill>{i.paidAt && <p className="mt-1 text-xs text-[var(--ink-3)]">{fmtDateTime(i.paidAt)} WIB</p>}</>)
                          : i.status === "pending_verification" ? <Pill tone="cyan">Menunggu verifikasi</Pill>
                          : i.orderId && recurring.has(i.orderId) && daysUntil(i.dueDate) >= 0 ? <Pill tone="slate">Belum jatuh tempo</Pill>
                          : <Pill tone="amber">Belum bayar</Pill>}
                      </td>
                      <td className={`${ptd} whitespace-nowrap text-right`}>
                        <span className="inline-flex gap-2">
                          {i.status === "unpaid" && <Link href={`/medan/dashboard/tagihan/${i.id}`} className="btn-primary btn-sm">Bayar</Link>}
                          <a href={`/medan/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Cetak invoice"><Printer className="h-3.5 w-3.5" /></a>
                        </span>
                      </td>
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
