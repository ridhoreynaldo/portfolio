import Link from "next/link";
import { requireUser } from "@/modules/auth/guards";
import { fmtIDR } from "@/modules/billing/labels";
import { listInvoices, listOrders } from "@/modules/billing/repository";
import { EmptyState } from "@/components/lc/ui";
import { InvoiceItem } from "@/components/lc/service-list";
import { PortalTitle } from "../ui";

export const metadata = { title: "Tagihan" };

const FILTERS = { open: "Belum lunas", paid: "Lunas", all: "Semua" } as const;
type F = keyof typeof FILTERS;

/** Tagihan pelanggan: filter belum lunas / lunas / semua; daftar bernomor yang bisa di-expand. */
export default async function PortalInvoices({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireUser("/dashboard/tagihan");
  const [{ f: raw }, orders, invoices] = await Promise.all([searchParams, listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const orderName = new Map(orders.map((o) => [o.id, o.packageName]));
  const visible = invoices.filter((i) => i.status !== "cancelled");
  const openList = visible.filter((i) => i.status === "unpaid" || i.status === "pending_verification").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paidList = visible.filter((i) => i.status === "paid").sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const allList = [...visible].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  // bawaan: belum lunas bila ada, selain itu lunas
  const f: F = raw && raw in FILTERS ? (raw as F) : openList.length ? "open" : "paid";
  const shown = f === "open" ? openList : f === "paid" ? paidList : allList;
  const count: Record<F, number> = { open: openList.length, paid: paidList.length, all: allList.length };

  return (
    <>
      <PortalTitle eyebrow="Pembayaran" title="Tagihan" sub="Klik satu tagihan untuk melihat rincian, membayar via QRIS / transfer, atau mencetak invoice." />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTERS) as F[]).map((k) => (
            <Link key={k} href={`/dashboard/tagihan?f=${k}`} scroll={false} className={`btn-sm ${f === k ? "btn-primary" : "btn-ghost"}`}>{FILTERS[k]} ({count[k]})</Link>
          ))}
        </div>
        {openList.length > 0 && <p className="text-sm text-[var(--ink-2)]">Total belum lunas: <b className="num text-[var(--ink)]">{fmtIDR(openList.reduce((n, i) => n + i.amount, 0))}</b></p>}
      </div>

      {shown.length ? (
        <div className="space-y-2">
          {shown.map((i, k) => <InvoiceItem key={i.id} i={i} no={k + 1} variant="customer" service={(i.orderId && orderName.get(i.orderId)) || undefined} />)}
        </div>
      ) : (
        <EmptyState title={visible.length ? `Tidak ada tagihan "${FILTERS[f].toLowerCase()}"` : "Belum ada tagihan"} sub={visible.length ? undefined : "Tagihan muncul di sini setelah layanan Anda dikonfirmasi."} />
      )}
    </>
  );
}
