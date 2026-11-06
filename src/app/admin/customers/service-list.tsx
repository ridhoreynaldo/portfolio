import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Badge, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { CYCLE, INVOICE_STATUS, daysUntil, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { orderTotal, orderUnitPrice, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { daysText, daysTone, serviceState } from "@/modules/billing/service-state";

/** Riwayat pembayaran (semua invoice, terbaru dulu). */
function History({ invoices }: { invoices: InvoiceRow[] }) {
  if (!invoices.length) return <p className="text-sm text-[var(--ink-3)]">Belum ada tagihan.</p>;
  return (
    <ol className="divide-y divide-[var(--line)] text-sm">
      {invoices.map((i, k) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span className="min-w-0">
            <span className="num mr-2 text-xs text-[var(--ink-3)]">{k + 1}.</span>{i.period ? fmtPeriod(i.period) : i.title}
            <span className="block pl-5 font-mono text-[11px] text-[var(--ink-3)]">
              {i.number} · jatuh tempo {fmtDate(i.dueDate)}{i.paidAt && ` · dibayar ${fmtDateTime(i.paidAt)}`}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="num font-semibold">{fmtIDR(i.amount)}</span>
            <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
            <a href={`/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Cetak</a>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Satu layanan: baris ringkas (yang sedang berjalan), bisa di-expand untuk detail + seluruh riwayat pembayaran. */
function ServiceItem({ o, invoices, no }: { o: OrderRow; invoices: InvoiceRow[]; no: number }) {
  const s = serviceState(o, invoices);
  const total = orderTotal(o);
  const history = invoices.filter((i) => i.orderId === o.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const nextAmount = s.next?.amount ?? (s.cycle !== "once" ? total : 0);
  return (
    <details className="expand group">
      <summary className="expand-row">
        <span className="row-no num">{String(no).padStart(2, "0")}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`}</span>
            <Badge tone={s.status.tone}>{s.status.label}</Badge>
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink-3)]">
            <span className="font-mono">{o.number}</span> · untuk {o.billTo || o.customerName}
          </span>
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--ink-2)]">
            <span>Jatuh tempo: <b>{s.next ? fmtDate(s.next.dueDate) : s.paidUntil ? fmtDate(s.paidUntil) : "—"}</b>{s.left != null && <span className={s.left < 0 ? "text-[var(--bad)]" : s.left <= 7 ? "text-[var(--warn)]" : "text-[var(--ink-3)]"}> ({daysText(s.left)})</span>}</span>
            <span>Tagihan selanjutnya: <b className="num">{nextAmount > 0 ? fmtIDR(nextAmount) : "—"}</b></span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-3)] transition group-open:rotate-180" aria-hidden />
      </summary>

      <div className="expand-body">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">Biaya</dt><dd className="num font-semibold">{total > 0 ? fmtIDR(total) : "Kesepakatan"} <span className="font-sans text-xs font-normal text-[var(--ink-3)]">{CYCLE[s.cycle]}</span></dd>{o.quantity > 1 && o.unitPrice != null && <dd className="text-xs text-[var(--ink-3)]">{fmtIDR(orderUnitPrice(o))} / unit</dd>}</div>
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">Mulai</dt><dd>{o.startDate ? fmtDate(o.startDate) : "—"}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">Aktif s.d.</dt><dd>{s.paidUntil ? fmtDate(s.paidUntil) : o.endDate ? fmtDate(o.endDate) : "—"}{s.leftActive != null && <span className="ml-1"><Badge tone={daysTone(s.leftActive)}>{daysText(s.leftActive)}</Badge></span>}</dd></div>
        </dl>
        {o.breakdown.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-lg bg-[var(--surface-2)] px-3 text-sm">
            {o.breakdown.map((b, k) => <li key={k} className="flex justify-between gap-3 py-1.5"><span className="text-[var(--ink-2)]">{b.description}</span><span className="num whitespace-nowrap">{fmtIDR(b.amount)}</span></li>)}
          </ul>
        )}
        {(o.items.length > 0 || o.itemLimit != null) && <p className="mt-3 text-sm text-[var(--ink-2)]"><b>{o.itemLabel || "Item"}</b> ({o.items.length}{o.itemLimit != null && `/${o.itemLimit}`}): <span className="font-mono text-xs">{o.items.join(", ") || "—"}</span></p>}

        <p className="detail-title mt-5">Riwayat pembayaran ({history.length})</p>
        <History invoices={history} />
        <Link href={`/admin/orders?view=${o.id}`} className="mt-3 inline-block text-sm font-semibold text-[var(--brand-ink)] hover:underline">Buka di halaman Layanan →</Link>
      </div>
    </details>
  );
}

/** Daftar layanan pelanggan untuk modal admin: yang berjalan tampil ringkas, sisanya dilipat. */
export function CustomerServices({ orders, invoices }: { orders: OrderRow[]; invoices: InvoiceRow[] }) {
  const running = orders.filter((o) => o.status === "active" || o.status === "pending");
  const ended = orders.filter((o) => o.status !== "active" && o.status !== "pending");
  const manual = invoices.filter((i) => !i.orderId || !orders.some((o) => o.id === i.orderId)).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const manualOpen = manual.filter((i) => i.status === "unpaid" || i.status === "pending_verification");

  return (
    <>
      <p className="detail-title">Layanan berjalan ({running.length})</p>
      {running.length ? (
        <div className="space-y-2">{running.map((o, k) => <ServiceItem key={o.id} o={o} invoices={invoices} no={k + 1} />)}</div>
      ) : <p className="text-sm text-[var(--ink-3)]">Tidak ada layanan yang sedang berjalan.</p>}

      {manual.length > 0 && (
        <details className="expand group mt-2">
          <summary className="expand-row">
            <span className="row-no num">+</span>
            <span className="min-w-0">
              <span className="font-semibold text-[var(--ink)]">Tagihan lain (manual)</span>
              <span className="mt-0.5 block text-xs text-[var(--ink-3)]">{manual.length} tagihan{manualOpen.length > 0 && <> · <b className="text-[var(--warn)]">{fmtIDR(manualOpen.reduce((n, i) => n + i.amount, 0))} belum dibayar</b>{manualOpen[0] && ` · jatuh tempo ${fmtDate(manualOpen[0].dueDate)} (${daysText(daysUntil(manualOpen[0].dueDate))})`}</>}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-3)] transition group-open:rotate-180" aria-hidden />
          </summary>
          <div className="expand-body"><History invoices={manual} /></div>
        </details>
      )}

      {ended.length > 0 && (
        <details className="group mt-4">
          <summary className="text-sm font-semibold text-[var(--ink-3)] hover:text-[var(--brand-ink)]">Layanan selesai / dibatalkan ({ended.length}) <ChevronDown className="inline h-3.5 w-3.5 transition group-open:rotate-180" /></summary>
          <div className="mt-2 space-y-2 opacity-80">{ended.map((o, k) => <ServiceItem key={o.id} o={o} invoices={invoices} no={k + 1} />)}</div>
        </details>
      )}
    </>
  );
}
