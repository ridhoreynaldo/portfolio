import Link from "next/link";
import { ChevronDown, Globe, Printer, QrCode, Server } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, ORDER_STATUS, billingDayOf, daysUntil, fmtIDR, fmtPeriod, paidUntilDate } from "@/modules/billing/labels";
import { listInvoices, listOrders, orderTotal, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { fmtDate } from "@/shared/ui";
import { Pill, PortalTitle, type Tone } from "./ui";

export const metadata = { title: "Langganan Saya" };

const daysText = (d: number) => (d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`);
const daysTone = (d: number): Tone => (d < 0 ? "rose" : d <= 7 ? "amber" : "emerald");

/** Satu jasa yang disewa: status, sisa waktu, dan rincian per periode di dalamnya. */
function ServiceCard({ o, invoices }: { o: OrderRow; invoices: InvoiceRow[] }) {
  const cycle = o.billingCycle ?? "once";
  const total = orderTotal(o);
  const Icon = /domain/i.test(o.packageName) ? Globe : Server;
  const day = billingDayOf(o.startDate);
  const mine = invoices.filter((i) => i.orderId === o.id && i.status !== "cancelled").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const next = mine.find((i) => i.status !== "paid"); // tagihan periode berikutnya (tampil sebagai jadwal, bukan "belum dibayar")
  const lastPaid = [...mine].reverse().find((i) => i.status === "paid");
  // sampai kapan sudah lunas
  const paidUntil = cycle === "monthly" ? (lastPaid?.period ? paidUntilDate(lastPaid.period, day) : null) : (o.endDate ?? null);
  const dueDate = next?.dueDate ?? (cycle === "yearly" ? o.endDate : null);
  const left = dueDate ? daysUntil(dueDate) : null;
  const label = o.itemLabel || "item";

  return (
    <article className="card overflow-hidden p-0">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#eef3ff] text-[var(--navy)]"><Icon className="h-5 w-5" /></span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[var(--navy)]">{o.packageName}{o.quantity > 1 && <span className="text-[var(--ink-3)]"> ×{o.quantity}</span>}</h2>
              <p className="text-sm text-[var(--ink-2)]">{total > 0 ? `${fmtIDR(total)} ${CYCLE[cycle]}` : "sesuai kesepakatan"}</p>
            </div>
          </div>
          <Pill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Pill>
        </div>

        {o.status === "active" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f3eee4] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Lunas sampai</p>
              <p className="font-serif text-lg font-semibold text-[var(--navy)]">{paidUntil ? fmtDate(paidUntil) : "—"}</p>
            </div>
            <div className="rounded-xl bg-[#f3eee4] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{cycle === "yearly" ? "Perpanjangan" : "Tagihan berikutnya"}</p>
              <p className="font-serif text-lg font-semibold text-[var(--navy)]">{dueDate ? fmtDate(dueDate) : "—"}</p>
              {left != null && <div className="mt-1"><Pill tone={daysTone(left)}>{daysText(left)}</Pill></div>}
            </div>
          </div>
        )}

        {o.items.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs text-[var(--ink-3)]">{label} · {o.items.length}{o.itemLimit != null && ` dari ${o.itemLimit}`}</p>
            <ul className="flex flex-wrap gap-1.5">{o.items.map((it) => <li key={it} className="tag font-mono !font-medium">{it}</li>)}</ul>
          </div>
        )}
        {o.adminNote && <p className="whitespace-pre-line border-l-2 border-[var(--gold)] pl-3 text-sm text-[var(--ink-2)]">{o.adminNote}</p>}

        {next && next.status === "unpaid" && (
          <Link href={`/jasa/dashboard/tagihan/${next.id}`} className="btn-gold w-full sm:w-auto sm:self-start"><QrCode className="h-4 w-4" /> Bayar {fmtIDR(next.amount)} via QRIS</Link>
        )}
        {next && next.status === "pending_verification" && <p className="text-sm text-[var(--ink-2)]">Bukti pembayaran sudah dikirim, menunggu verifikasi.</p>}
      </div>

      {mine.length > 0 && (
        <details className="group border-t border-[var(--rule)] bg-white/60">
          <summary className="flex cursor-pointer items-center justify-between px-6 py-3 text-sm font-semibold text-[var(--navy)] hover:bg-white">
            Rincian & periode
            <ChevronDown className="h-4 w-4 text-[var(--ink-3)] transition group-open:rotate-180" />
          </summary>
          <ol className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]">
            {mine.map((i, k) => {
              const d = daysUntil(i.dueDate);
              const lines = i.items.length ? i.items : [];
              return (
                <li key={i.id} className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--navy)] font-mono text-[11px] font-semibold text-white">{k + 1}</span>
                    <span className="font-semibold text-[var(--navy)]">{i.period ? fmtPeriod(i.period) : i.title}</span>
                    <span className="font-serif text-[var(--navy)]">{fmtIDR(i.amount)}</span>
                    {i.status === "paid" ? (
                      <Pill tone="emerald">Lunas{i.paidAt ? ` · ${fmtDate(new Date(i.paidAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10))}` : ""}</Pill>
                    ) : (
                      <Pill tone={daysTone(d)}>{fmtDate(i.dueDate)} · {daysText(d)}</Pill>
                    )}
                    <span className="ml-auto flex gap-2">
                      {i.status === "unpaid" && <Link href={`/jasa/dashboard/tagihan/${i.id}`} className="btn-primary btn-sm">Bayar</Link>}
                      <a href={`/jasa/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm" title="Cetak invoice"><Printer className="h-3.5 w-3.5" /></a>
                    </span>
                  </div>
                  {lines.length > 0 && (
                    <ul className="mt-2 space-y-1 pl-9 text-sm">
                      {lines.map((l, x) => <li key={x} className="flex justify-between gap-4 text-[var(--ink-2)]"><span className="before:mr-2 before:text-[var(--gold)] before:content-['◆']">{l.description}</span><span>{fmtIDR(l.amount)}</span></li>)}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </details>
      )}
    </article>
  );
}

export default async function Dashboard() {
  const user = await requireUser("/jasa/dashboard");
  const [orders, invoices] = await Promise.all([listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const shown = orders.filter((o) => o.status === "active" || o.status === "pending");

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title="Jasa yang Anda Sewa" right={<Link href="/jasa#paket" className="btn-primary btn-sm">+ Sewa / pesan layanan</Link>} />
      <section className="grid gap-5 lg:grid-cols-2">
        {shown.map((o) => <ServiceCard key={o.id} o={o} invoices={invoices} />)}
        {!shown.length && <p className="card p-6 text-sm text-[var(--ink-2)] lg:col-span-2">Belum ada jasa yang disewa. <Link href="/jasa#paket" className="font-semibold text-[var(--navy)] hover:underline">Lihat paket →</Link></p>}
      </section>
    </>
  );
}
