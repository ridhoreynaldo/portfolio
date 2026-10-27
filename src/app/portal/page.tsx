import Link from "next/link";
import { CircleAlert, QrCode, Receipt } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { INVOICE_STATUS, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { billingStats, getPaymentSettings, listInvoices } from "@/modules/billing/repository";
import { fmtDate } from "@/shared/ui";
import { Pill, PortalTitle, Stat, ptd, pth } from "./ui";

export default async function PortalHome() {
  const user = await requireUser("/portal");
  const [invoices, stats, pay] = await Promise.all([listInvoices({ userId: user.id }), billingStats(user.id), getPaymentSettings()]);
  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification");

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title={<>Tagihan Saya</>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Belum dibayar" value={fmtIDR(stats.unpaidTotal)} sub={`${stats.unpaid + stats.verifying} tagihan`} />
        <Stat label="Menunggu verifikasi" value={stats.verifying} sub="bukti sudah diunggah" />
        <Stat label="Langganan aktif" value={stats.activeOrders} sub={<>{stats.pendingOrders} menunggu konfirmasi · <Link href="/portal/orders" className="font-semibold text-[var(--navy)] hover:underline">lihat langganan</Link></>} />
      </div>

      {open.length > 0 && (
        <div className="card mt-6 flex flex-col gap-3 border-l-4 border-l-[var(--gold)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
            <div>
              <p className="font-semibold text-[var(--navy)]">Ada {open.length} tagihan yang perlu diselesaikan.</p>
              <p className="text-sm text-[var(--ink-2)]">Buka tagihan, scan QRIS{pay?.bankAccount ? " atau transfer bank" : ""}, lalu unggah bukti pembayaran. Status berubah otomatis setelah diverifikasi.</p>
            </div>
          </div>
          <Link href={`/portal/invoices/${open[0]!.id}`} className="btn-gold btn-sm shrink-0"><QrCode className="h-3.5 w-3.5" /> Bayar sekarang</Link>
        </div>
      )}

      <section className="card mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f3eee4]"><tr><th className={pth}>Nomor</th><th className={pth}>Tagihan</th><th className={pth}>Periode</th><th className={pth}>Jatuh tempo</th><th className={pth}>Nominal</th><th className={pth}>Status</th><th className={pth} /></tr></thead>
            <tbody>
              {invoices.map((i) => {
                const late = isOverdue(i.dueDate, i.status);
                return (
                  <tr key={i.id} className="hover:bg-white">
                    <td className={`${ptd} font-mono text-xs text-[var(--navy-2)]`}>{i.number}</td>
                    <td className={`${ptd} text-[var(--ink)]`}>{i.title}</td>
                    <td className={ptd}>{fmtPeriod(i.period)}</td>
                    <td className={`${ptd} ${late ? "font-semibold text-[#9b1c1c]" : ""}`}>{fmtDate(i.dueDate)}{late && " · lewat"}</td>
                    <td className={`${ptd} font-semibold text-[var(--navy)]`}>{fmtIDR(i.amount)}</td>
                    <td className={ptd}><Pill tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Pill></td>
                    <td className={`${ptd} text-right`}><Link href={`/portal/invoices/${i.id}`} className={`${i.status === "unpaid" ? "btn-primary" : "btn-ghost"} btn-sm`}><Receipt className="h-3.5 w-3.5" /> {i.status === "unpaid" ? "Bayar" : "Detail"}</Link></td>
                  </tr>
                );
              })}
              {!invoices.length && <tr><td className={ptd} colSpan={7}>Belum ada tagihan. Tagihan muncul setelah pesanan Anda dikonfirmasi.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
