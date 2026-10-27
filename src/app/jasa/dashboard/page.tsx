import Link from "next/link";
import { ChevronDown, CircleAlert, Printer, QrCode, Receipt } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { INVOICE_STATUS, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { billingStats, getPaymentSettings, listInvoices } from "@/modules/billing/repository";
import { fmtDate } from "@/shared/ui";
import { Pill, PortalTitle, Stat } from "./ui";

export default async function PortalHome() {
  const user = await requireUser("/jasa/dashboard");
  const [invoices, stats, pay] = await Promise.all([listInvoices({ userId: user.id }), billingStats(user.id), getPaymentSettings()]);
  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification");

  return (
    <>
      <PortalTitle eyebrow={`Halo, ${user.name}`} title={<>Tagihan Saya</>} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Belum dibayar" value={fmtIDR(stats.unpaidTotal)} sub={`${stats.unpaid + stats.verifying} tagihan`} />
        <Stat label="Menunggu verifikasi" value={stats.verifying} sub="bukti sudah diunggah" />
        <Stat label="Langganan aktif" value={stats.activeOrders} sub={<>{stats.pendingOrders} menunggu konfirmasi · <Link href="/jasa/dashboard/langganan" className="font-semibold text-[var(--navy)] hover:underline">lihat langganan</Link></>} />
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
          <Link href={`/jasa/dashboard/tagihan/${open[0]!.id}`} className="btn-gold btn-sm shrink-0"><QrCode className="h-3.5 w-3.5" /> Bayar sekarang</Link>
        </div>
      )}

      <section className="mt-8">
        <p className="eyebrow mb-3">Daftar tagihan · klik untuk melihat rincian</p>
        <div className="card divide-y divide-[var(--rule)] overflow-hidden p-0">
          {invoices.map((i) => {
            const late = isOverdue(i.dueDate, i.status);
            const lines = i.items.length ? i.items : [{ description: i.title, amount: i.amount }];
            return (
              <details key={i.id} className="group" open={i.status === "unpaid"}>
                <summary className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-white sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-x-6">
                  <ChevronDown className="hidden h-4 w-4 text-[var(--ink-3)] transition group-open:rotate-180 sm:block" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--navy)]">{i.title}</p>
                    <p className="font-mono text-[11px] text-[var(--ink-3)]">{i.number}{i.period && ` · ${fmtPeriod(i.period)}`} · {i.items.length || 1} baris</p>
                  </div>
                  <p className={`text-sm ${late ? "font-semibold text-[#9b1c1c]" : "text-[var(--ink-2)]"}`}>{i.status === "paid" && i.paidAt ? `dibayar ${fmtDate(i.paidAt.toISOString().slice(0, 10))}` : `jatuh tempo ${fmtDate(i.dueDate)}${late ? " · lewat" : ""}`}</p>
                  <p className="font-serif text-lg font-semibold text-[var(--navy)]">{fmtIDR(i.amount)}</p>
                  <Pill tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Pill>
                </summary>
                <div className="border-t border-dashed border-[var(--rule)] bg-white/60 px-5 py-4">
                  <table className="w-full text-sm">
                    <tbody>
                      {lines.map((l, k) => (
                        <tr key={k} className="border-b border-[var(--rule)] last:border-0">
                          <td className="py-1.5 pl-6 text-[var(--ink)] before:mr-2 before:text-[var(--gold)] before:content-['◆']">{l.description}</td>
                          <td className="py-1.5 text-right text-[var(--ink-2)]">{fmtIDR(l.amount)}</td>
                        </tr>
                      ))}
                      <tr><td className="pt-2 pl-6 font-semibold text-[var(--navy)]">Total</td><td className="pt-2 text-right font-semibold text-[var(--navy)]">{fmtIDR(i.amount)}</td></tr>
                    </tbody>
                  </table>
                  {i.note && <p className="mt-2 text-xs text-[var(--ink-3)]">{i.note}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/jasa/dashboard/tagihan/${i.id}`} className={`${i.status === "unpaid" ? "btn-primary" : "btn-ghost"} btn-sm`}><Receipt className="h-3.5 w-3.5" /> {i.status === "unpaid" ? "Bayar" : "Detail"}</Link>
                    <a href={`/jasa/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Printer className="h-3.5 w-3.5" /> Cetak invoice</a>
                  </div>
                </div>
              </details>
            );
          })}
          {!invoices.length && <p className="p-5 text-sm text-[var(--ink-3)]">Belum ada tagihan. Tagihan muncul setelah pesanan Anda dikonfirmasi.</p>}
        </div>
      </section>
    </>
  );
}
