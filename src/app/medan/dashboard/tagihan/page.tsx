import Link from "next/link";
import { Printer } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { daysUntil, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { listInvoices, listOrders, type InvoiceRow } from "@/modules/billing/repository";
import { EmptyState, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { Pill, PortalTitle } from "../ui";

export const metadata = { title: "Tagihan" };

/** Riwayat tagihan pelanggan: kartu di HP, tabel di desktop. */
export default async function PortalInvoices() {
  const user = await requireUser("/dashboard/tagihan");
  const [orders, invoices] = await Promise.all([listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const orderName = new Map(orders.map((o) => [o.id, o.packageName]));
  const recurring = new Set(orders.filter((o) => (o.billingCycle ?? "once") !== "once").map((o) => o.id));
  const history = invoices.filter((i) => i.status !== "cancelled").sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const status = (i: InvoiceRow) =>
    i.status === "paid" ? <Pill tone="emerald">Sudah bayar</Pill>
      : i.status === "pending_verification" ? <Pill tone="cyan">Menunggu verifikasi</Pill>
      : i.orderId && recurring.has(i.orderId) && daysUntil(i.dueDate) >= 0 ? <Pill tone="slate">Belum jatuh tempo</Pill>
      : <Pill tone="amber">Belum bayar</Pill>;
  const sub = (i: InvoiceRow) => [(i.orderId && orderName.get(i.orderId)) || "", i.period ? fmtPeriod(i.period) : ""].filter(Boolean).join(" · ");
  const actions = (i: InvoiceRow) => (
    <span className="inline-flex gap-2">
      {i.status === "unpaid" && <Link href={`/dashboard/tagihan/${i.id}`} className="btn-primary btn-sm">Bayar</Link>}
      <a href={`/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm btn-icon" title="Cetak invoice" aria-label="Cetak invoice"><Printer className="h-3.5 w-3.5" /></a>
    </span>
  );

  return (
    <>
      <PortalTitle eyebrow="Pembayaran" title="Tagihan" sub="Semua tagihan Anda. Bayar via QRIS atau transfer, lalu unggah bukti di halaman tagihan." />
      {!history.length ? (
        <EmptyState title="Belum ada tagihan" sub="Tagihan muncul di sini setelah layanan Anda dikonfirmasi." />
      ) : (
        <>
          {/* HP: kartu */}
          <ul className="space-y-3 md:hidden">
            {history.map((i) => (
              <li key={i.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-[var(--ink)]">{i.title}</p>
                    <p className="text-xs text-[var(--ink-3)]">{sub(i)}</p>
                  </div>
                  {status(i)}
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 border-t border-[var(--line)] pt-3">
                  <div>
                    <p className="text-lg font-bold text-[var(--ink)]">{fmtIDR(i.amount)}</p>
                    <p className="text-xs text-[var(--ink-3)]"><span className="font-mono">{i.number}</span> · jatuh tempo {fmtDate(i.dueDate)}</p>
                    {i.status === "paid" && i.paidAt && <p className="text-xs text-[var(--ink-3)]">Dibayar {fmtDateTime(i.paidAt)} WIB</p>}
                  </div>
                  {actions(i)}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: tabel */}
          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Tagihan</th><th>Layanan / Periode</th><th>Kepada</th><th>Jumlah</th><th>Jatuh tempo</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {history.map((i) => (
                    <tr key={i.id}>
                      <td className="whitespace-nowrap font-mono text-xs">{i.number}</td>
                      <td><p className="font-medium text-[var(--ink)]">{i.title}</p><p className="text-xs text-[var(--ink-3)]">{sub(i)}</p></td>
                      <td>{i.billTo || user.name}</td>
                      <td className="whitespace-nowrap font-semibold text-[var(--ink)]">{fmtIDR(i.amount)}</td>
                      <td className="whitespace-nowrap">{fmtDate(i.dueDate)}</td>
                      <td>{status(i)}{i.status === "paid" && i.paidAt && <p className="mt-1 text-xs text-[var(--ink-3)]">{fmtDateTime(i.paidAt)} WIB</p>}</td>
                      <td className="whitespace-nowrap text-right">{actions(i)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
