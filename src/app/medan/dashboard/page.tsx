import Link from "next/link";
import { ArrowRight, CalendarClock, QrCode, Receipt, Server, Wallet } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { CYCLE, ORDER_STATUS, billingDayOf, daysUntil, fmtIDR, paidUntilDate } from "@/modules/billing/labels";
import { listInvoices, listOrders, orderTotal, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { EmptyState, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { Pill, PortalTitle, Stat, type Tone } from "./ui";

export const metadata = { title: "Ringkasan" };

const daysText = (d: number) => (d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`);
const daysTone = (d: number): Tone => (d < 0 ? "rose" : d <= 7 ? "amber" : "emerald");

/** Status pembayaran satu layanan + tagihan yang sedang terbuka. */
function serviceState(o: OrderRow, invoices: InvoiceRow[]) {
  const cycle = o.billingCycle ?? "once";
  const day = billingDayOf(o.startDate);
  const mine = invoices.filter((i) => i.orderId === o.id && i.status !== "cancelled").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const next = mine.find((i) => i.status !== "paid");
  const lastPaid = [...mine].reverse().find((i) => i.status === "paid");
  const paidUntil = cycle === "monthly" ? (lastPaid?.period ? paidUntilDate(lastPaid.period, day) : null) : cycle === "yearly" ? (o.endDate ?? null) : null;
  const left = next ? daysUntil(next.dueDate) : null;
  let status: { label: string; tone: Tone };
  if (mine.length === 0) status = { label: ORDER_STATUS[o.status].label, tone: ORDER_STATUS[o.status].tone };
  else if (next?.status === "pending_verification") status = { label: "Menunggu verifikasi", tone: "cyan" };
  else if (!next || (cycle !== "once" && left != null && left >= 0)) status = { label: "Sudah bayar", tone: "emerald" }; // langganan: belum jatuh tempo = periode berjalan sudah dibayar
  else status = cycle === "once" ? { label: "Belum bayar", tone: "amber" } : { label: "Lewat jatuh tempo", tone: "rose" };
  const canPay = next?.status === "unpaid" && (cycle === "once" || (left ?? 0) <= 7);
  return { cycle, next, lastPaid, paidUntil, left, status, canPay };
}

function ServiceCard({ o, invoices, user }: { o: OrderRow; invoices: InvoiceRow[]; user: string }) {
  const s = serviceState(o, invoices);
  const total = orderTotal(o);
  const label = o.itemLabel || "item";
  return (
    <article className="card flex flex-col p-4 md:p-5">
      <div className="flex items-start gap-3">
        <span className="icon-box"><Server className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug text-[var(--ink)]">{o.packageName}{o.quantity > 1 && <span className="text-[var(--ink-3)]"> ×{o.quantity}</span>}</h3>
            <Pill tone={s.status.tone}>{s.status.label}</Pill>
          </div>
          <p className="mt-0.5 text-xs text-[var(--ink-3)]"><span className="font-mono">{o.number}</span> · untuk {o.billTo || user}</p>
        </div>
      </div>

      {o.items.length > 0 && (
        <div className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-2)]">
          <span className="font-semibold">{label} ({o.items.length}{o.itemLimit != null && `/${o.itemLimit}`}):</span> {o.items.join(", ")}
          {o.itemLimit != null && <span className="meter mt-2"><span style={{ width: `${Math.min(100, (o.items.length / Math.max(1, o.itemLimit)) * 100)}%` }} /></span>}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 text-sm">
        <div>
          <dt className="text-xs text-[var(--ink-3)]">Biaya</dt>
          <dd className="font-semibold text-[var(--ink)]">{total > 0 ? fmtIDR(total) : "—"}</dd>
          <dd className="text-xs text-[var(--ink-3)]">{CYCLE[s.cycle]}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--ink-3)]">{s.next ? "Jatuh tempo" : s.paidUntil ? "Berlaku s.d." : "Pembayaran"}</dt>
          {s.next ? (
            <>
              <dd className="font-semibold text-[var(--ink)]">{fmtDate(s.next.dueDate)}</dd>
              {s.left != null && <dd className="mt-0.5"><Pill tone={daysTone(s.left)}>{daysText(s.left)}</Pill></dd>}
            </>
          ) : s.paidUntil ? (
            <dd className="font-semibold text-[var(--ink)]">{fmtDate(s.paidUntil)}</dd>
          ) : (
            <dd className="text-[var(--ink-2)]">{s.lastPaid?.paidAt ? `${fmtDateTime(s.lastPaid.paidAt)} WIB` : "—"}</dd>
          )}
        </div>
      </dl>

      {s.canPay && s.next && (
        <Link href={`/medan/dashboard/tagihan/${s.next.id}`} className="btn-gold btn-sm mt-4 w-full"><QrCode className="h-3.5 w-3.5" /> Bayar {fmtIDR(s.next.amount)}</Link>
      )}
    </article>
  );
}

export default async function Dashboard() {
  const user = await requireUser("/medan/dashboard");
  const [orders, invoices] = await Promise.all([listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const shown = orders.filter((o) => o.status === "active" || o.status === "pending");
  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const due = open.filter((i) => i.status === "unpaid");
  const nearest = open[0];
  const monthly = shown.filter((o) => o.billingCycle === "monthly").reduce((n, o) => n + orderTotal(o), 0);

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title="Ringkasan" sub="Layanan yang Anda pakai dan tagihan yang perlu dibayar." />

      <div className="mb-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Layanan aktif" value={shown.length} icon={<Server className="h-4 w-4" />} />
        <Stat label="Biaya bulanan" value={monthly > 0 ? fmtIDR(monthly) : "—"} icon={<Wallet className="h-4 w-4" />} />
        <Stat label="Tagihan terbuka" value={due.length} sub={due.length ? fmtIDR(due.reduce((n, i) => n + i.amount, 0)) : "Tidak ada"} icon={<Receipt className="h-4 w-4" />} href="/medan/dashboard/tagihan" />
        <Stat label="Jatuh tempo terdekat" value={nearest ? fmtDate(nearest.dueDate) : "—"} sub={nearest ? daysText(daysUntil(nearest.dueDate)) : undefined} icon={<CalendarClock className="h-4 w-4" />} />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--ink)]">Layanan Anda</h2>
        <Link href="/medan/dashboard/tagihan" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-ink)] hover:underline">Semua tagihan <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
      {shown.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {shown.map((o) => <ServiceCard key={o.id} o={o} invoices={invoices} user={user.name} />)}
        </div>
      ) : (
        <EmptyState title="Belum ada layanan" sub="Pilih paket di halaman Leetcloud. Setelah dikonfirmasi, layanan dan tagihannya muncul di sini." action={<Link href="/medan#paket" className="btn-primary btn-sm">Lihat paket</Link>} />
      )}
    </>
  );
}
