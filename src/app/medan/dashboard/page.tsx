import Link from "next/link";
import { CalendarClock, Receipt, Server, Wallet } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { daysUntil, fmtIDR } from "@/modules/billing/labels";
import { listInvoices, listOrders, orderTotal } from "@/modules/billing/repository";
import { daysText } from "@/modules/billing/service-state";
import { EmptyState, fmtDate } from "@/components/lc/ui";
import { ServiceItem } from "@/components/lc/service-list";
import { PortalTitle, Stat } from "./ui";

export const metadata = { title: "Ringkasan" };

const FILTERS = { running: "Sedang berjalan", ended: "Selesai", all: "Semua" } as const;
type F = keyof typeof FILTERS;

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const user = await requireUser("/dashboard");
  const [{ f: raw }, orders, invoices] = await Promise.all([searchParams, listOrders({ userId: user.id }), listInvoices({ userId: user.id })]);
  const f: F = raw && raw in FILTERS ? (raw as F) : "running";
  const running = orders.filter((o) => o.status === "active" || o.status === "pending");
  const ended = orders.filter((o) => o.status !== "active" && o.status !== "pending");
  const shown = f === "running" ? running : f === "ended" ? ended : orders;
  const count: Record<F, number> = { running: running.length, ended: ended.length, all: orders.length };

  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const due = open.filter((i) => i.status === "unpaid");
  const nearest = open[0];
  const monthly = running.filter((o) => o.billingCycle === "monthly").reduce((n, o) => n + orderTotal(o), 0);

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title="Ringkasan" sub="Layanan yang Anda pakai. Klik satu layanan untuk melihat detail dan riwayat pembayarannya." />

      <div className="mb-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Stat label="Layanan aktif" value={running.length} icon={<Server className="h-4 w-4" />} />
        <Stat label="Biaya bulanan" value={monthly > 0 ? fmtIDR(monthly) : "—"} icon={<Wallet className="h-4 w-4" />} />
        <Stat label="Tagihan terbuka" value={due.length} sub={due.length ? fmtIDR(due.reduce((n, i) => n + i.amount, 0)) : "Tidak ada"} icon={<Receipt className="h-4 w-4" />} href="/dashboard/tagihan" />
        <Stat label="Jatuh tempo terdekat" value={nearest ? fmtDate(nearest.dueDate) : "—"} sub={nearest ? daysText(daysUntil(nearest.dueDate)) : undefined} icon={<CalendarClock className="h-4 w-4" />} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--ink)]">Layanan Anda</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FILTERS) as F[]).map((k) => (
            <Link key={k} href={k === "running" ? "/dashboard" : `/dashboard?f=${k}`} scroll={false} className={`btn-sm ${f === k ? "btn-primary" : "btn-ghost"}`}>{FILTERS[k]} ({count[k]})</Link>
          ))}
        </div>
      </div>

      {shown.length ? (
        <div className="space-y-2">{shown.map((o, k) => <ServiceItem key={o.id} o={o} invoices={invoices} no={k + 1} variant="customer" />)}</div>
      ) : orders.length ? (
        <EmptyState title={`Tidak ada layanan "${FILTERS[f].toLowerCase()}"`} action={<Link href="/dashboard?f=all" className="btn-ghost btn-sm">Lihat semua</Link>} />
      ) : (
        <EmptyState title="Belum ada layanan" sub="Pilih paket di halaman utama. Setelah dikonfirmasi, layanan dan tagihannya muncul di sini." action={<Link href="/#paket" className="btn-primary btn-sm">Lihat paket</Link>} />
      )}
    </>
  );
}
