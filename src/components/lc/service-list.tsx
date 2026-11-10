import Link from "next/link";
import { ChevronDown, Printer, QrCode } from "lucide-react";
import { Badge, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { CYCLE, INVOICE_STATUS, daysUntil, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { orderTotal, orderUnitPrice, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { deleteInvoiceAction, deleteOrderAction, setInvoiceStatusAction } from "@/modules/billing/actions";
import { daysText, daysTone, serviceState } from "@/modules/billing/service-state";

/**
 * Daftar layanan & tagihan yang bisa di-expand (details/summary, tanpa JS).
 * variant "admin"  → tautan ke halaman Layanan admin
 * variant "customer" → tombol Bayar ke halaman tagihan pelanggan
 */
export type Variant = "admin" | "customer";

/** Konteks aksi admin (edit/hapus/tandai lunas) di dalam halaman Pelanggan. */
export type AdminCtx = {
  customerId: string;
  canEditOrder: boolean; canDeleteOrder: boolean; canCreateInvoice: boolean; canEditInvoice: boolean; canDeleteInvoice: boolean;
  notes: Record<string, string>;
};
const hub = (c: AdminCtx) => `/admin/customers?view=${c.customerId}`;

const Due = ({ date, open }: { date: string; open: boolean }) => {
  if (!open) return <>{fmtDate(date)}</>;
  const d = daysUntil(date);
  return <>{fmtDate(date)} <span className={d < 0 ? "text-[var(--bad)]" : d <= 7 ? "text-[var(--warn)]" : "text-[var(--ink-3)]"}>({daysText(d)})</span></>;
};

/** Satu tagihan yang bisa di-expand: ringkas (judul, nominal, status, jatuh tempo) → rincian + aksi. */
export function InvoiceItem({ i, no, variant, service }: { i: InvoiceRow; no: number; variant: Variant; service?: string }) {
  const open = i.status === "unpaid" || i.status === "pending_verification";
  return (
    <details className="expand group">
      <summary className="expand-row">
        <span className="row-no num">{no}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">{i.period ? `${service ?? i.title.split(" — ")[0]} · ${fmtPeriod(i.period)}` : i.title}</span>
            <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink-3)]">Jatuh tempo <Due date={i.dueDate} open={open} /></span>
        </span>
        <span className="flex items-center gap-2">
          <span className="num text-sm font-bold text-[var(--ink)]">{fmtIDR(i.amount)}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--ink-3)] transition group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="expand-body text-sm">
        <dl className="grid gap-3 sm:grid-cols-3">
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">Nomor</dt><dd className="font-mono text-xs">{i.number}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">Kepada</dt><dd>{i.billTo || i.customerName}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-[var(--ink-3)]">{i.status === "paid" ? "Dibayar" : "Status"}</dt><dd>{i.paidAt ? `${fmtDateTime(i.paidAt)} WIB` : INVOICE_STATUS[i.status].label}</dd></div>
        </dl>
        {i.items.length > 0 && (
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-lg bg-[var(--surface-2)] px-3">
            {i.items.map((l, k) => <li key={k} className="flex justify-between gap-3 py-1.5"><span className="text-[var(--ink-2)]">{l.description}{l.note && <span className="block text-xs text-[var(--ink-3)]">{l.note}</span>}</span><span className="num whitespace-nowrap">{fmtIDR(l.amount)}</span></li>)}
          </ul>
        )}
        {i.note && <p className="mt-3 text-xs text-[var(--ink-3)]">{i.note}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {variant === "customer" && i.status === "unpaid" && <Link href={`/dashboard/tagihan/${i.id}`} className="btn-gold btn-sm"><QrCode className="h-3.5 w-3.5" /> Bayar</Link>}
          {variant === "customer" && i.status === "pending_verification" && <Link href={`/dashboard/tagihan/${i.id}`} className="btn-ghost btn-sm">Lihat bukti</Link>}
          <a href={`/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Printer className="h-3.5 w-3.5" /> Cetak</a>
        </div>
      </div>
    </details>
  );
}

/** Riwayat pembayaran ringkas di dalam satu layanan. */
function History({ invoices, variant, ctx }: { invoices: InvoiceRow[]; variant: Variant; ctx?: AdminCtx }) {
  if (!invoices.length) return <p className="text-sm text-[var(--ink-3)]">Belum ada tagihan.</p>;
  return (
    <ol className="divide-y divide-[var(--line)] text-sm">
      {invoices.map((i, k) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span className="min-w-0">
            <span className="num mr-2 text-xs text-[var(--ink-3)]">{k + 1}.</span>{i.period ? fmtPeriod(i.period) : i.title}
            <span className="block pl-5 font-mono text-[11px] text-[var(--ink-3)]">{i.number} · jatuh tempo {fmtDate(i.dueDate)}{i.paidAt && ` · dibayar ${fmtDateTime(i.paidAt)}`}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="num font-semibold">{fmtIDR(i.amount)}</span>
            <Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge>
            {variant === "customer" && i.status === "unpaid" && <Link href={`/dashboard/tagihan/${i.id}`} className="btn-gold btn-sm">Bayar</Link>}
            <a href={`/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm btn-icon" title="Cetak" aria-label="Cetak invoice"><Printer className="h-3.5 w-3.5" /></a>
          </span>
          {ctx && (
            <span className="flex w-full flex-wrap items-center gap-1.5 pl-5">
              {ctx.notes[i.id] && <span className="w-full whitespace-pre-line rounded border border-dashed border-[var(--line)] px-2 py-1 text-xs text-[var(--ink-2)]"><b>🔒 Internal:</b> {ctx.notes[i.id]}</span>}
              {ctx.canEditInvoice && i.status !== "paid" && i.status !== "cancelled" && <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value="paid" /><button className="btn-primary btn-sm">Tandai lunas</button></form>}
              {ctx.canEditInvoice && i.status === "paid" && <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value="unpaid" /><button className="btn-ghost btn-sm">Batal lunas</button></form>}
              {ctx.canEditInvoice && i.status === "unpaid" && <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={i.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn-ghost btn-sm">Batalkan</button></form>}
              {i.proofFileId && <a href={`/api/files/${i.proofFileId}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Bukti bayar ↗</a>}
              {ctx.canEditInvoice && <Link href={`${hub(ctx)}&inv=${i.id}`} scroll={false} className="btn-ghost btn-sm">Edit tagihan</Link>}
              {ctx.canDeleteInvoice && <form action={deleteInvoiceAction}><input type="hidden" name="id" value={i.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Satu layanan: baris ringkas, bisa di-expand untuk detail + seluruh riwayat pembayaran. */
export function ServiceItem({ o, invoices, no, variant, ctx }: { o: OrderRow; invoices: InvoiceRow[]; no: number; variant: Variant; ctx?: AdminCtx }) {
  const s = serviceState(o, invoices);
  const total = orderTotal(o);
  const history = invoices.filter((i) => i.orderId === o.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const nextAmount = s.next?.amount ?? (s.cycle !== "once" ? total : 0);
  // jatuh tempo + hitung mundur: tagihan terbuka bila ada; kalau sudah lunas, tanggal perpanjangan berikutnya (bulanan/tahunan)
  const dueDate = s.next?.dueDate ?? (s.cycle !== "once" ? s.paidUntil : null);
  const dueLeft = dueDate ? daysUntil(dueDate) : null;
  return (
    <details className="expand group">
      <summary className="expand-row">
        <span className="row-no num">{no}</span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[var(--ink)]">{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`}</span>
            <Badge tone={s.status.tone}>{s.status.label}</Badge>
          </span>
          <span className="mt-0.5 block text-xs text-[var(--ink-3)]"><span className="font-mono">{o.number}</span> · untuk {o.billTo || o.customerName}</span>
          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--ink-2)]">
            <span>{s.next ? "Jatuh tempo" : "Perpanjangan"}: <b>{dueDate ? fmtDate(dueDate) : "—"}</b>{dueLeft != null && <span className={dueLeft < 0 ? "text-[var(--bad)]" : dueLeft <= 7 ? "text-[var(--warn)]" : "text-[var(--ink-3)]"}> · {daysText(dueLeft)}</span>}</span>
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
        {variant === "customer" && o.adminNote && <p className="mt-3 whitespace-pre-line text-sm text-[var(--ink-2)]">{o.adminNote}</p>}
        {variant === "customer" && s.canPay && s.next && <Link href={`/dashboard/tagihan/${s.next.id}`} className="btn-gold btn-sm mt-3"><QrCode className="h-3.5 w-3.5" /> Bayar {fmtIDR(s.next.amount)}</Link>}

        <p className="detail-title mt-5">Riwayat pembayaran ({history.length})</p>
        <History invoices={history} variant={variant} ctx={ctx} />
        {ctx && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--line)] pt-3">
            {ctx.canEditOrder && <Link href={`${hub(ctx)}&order=${o.id}`} scroll={false} className="btn-primary btn-sm">Edit layanan</Link>}
            {ctx.canCreateInvoice && <Link href={`${hub(ctx)}&inv=new&o=${o.id}`} scroll={false} className="btn-gold btn-sm">+ Tagihan</Link>}
            {ctx.canDeleteOrder && <form action={deleteOrderAction} className="ml-auto"><input type="hidden" name="id" value={o.id} /><button className="btn-danger btn-sm">Hapus layanan</button></form>}
          </div>
        )}
      </div>
    </details>
  );
}

/** Daftar layanan pelanggan untuk modal admin: yang berjalan tampil ringkas, sisanya dilipat. */
export function CustomerServices({ orders, invoices, ctx }: { orders: OrderRow[]; invoices: InvoiceRow[]; ctx?: AdminCtx }) {
  // urut: sisa hari paling sedikit dulu (yang terlambat paling atas); sekali bayar paling bawah
  const rank = (o: OrderRow) => {
    const s = serviceState(o, invoices);
    if (s.cycle === "once") return { once: 1, due: "" };
    return { once: 0, due: s.next?.dueDate ?? s.paidUntil ?? "9999-12-31" };
  };
  const running = orders
    .filter((o) => o.status === "active" || o.status === "pending")
    .sort((a, b) => {
      const x = rank(a), y = rank(b);
      return x.once - y.once || x.due.localeCompare(y.due) || a.number.localeCompare(b.number);
    });
  const ended = orders.filter((o) => o.status !== "active" && o.status !== "pending");
  const manual = invoices.filter((i) => !i.orderId || !orders.some((o) => o.id === i.orderId)).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const manualOpen = manual.filter((i) => i.status === "unpaid" || i.status === "pending_verification");

  return (
    <>
      <p className="detail-title">Layanan berjalan ({running.length})</p>
      {running.length ? (
        <div className="space-y-2">{running.map((o, k) => <ServiceItem key={o.id} o={o} invoices={invoices} no={k + 1} variant="admin" ctx={ctx} />)}</div>
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
          <div className="expand-body"><History invoices={manual} variant="admin" ctx={ctx} /></div>
        </details>
      )}

      {ended.length > 0 && (
        <details className="group mt-4">
          <summary className="text-sm font-semibold text-[var(--ink-3)] hover:text-[var(--brand-ink)]">Layanan selesai / dibatalkan ({ended.length}) <ChevronDown className="inline h-3.5 w-3.5 transition group-open:rotate-180" /></summary>
          <div className="mt-2 space-y-2 opacity-80">{ended.map((o, k) => <ServiceItem key={o.id} o={o} invoices={invoices} no={k + 1} variant="admin" ctx={ctx} />)}</div>
        </details>
      )}
    </>
  );
}
