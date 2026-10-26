import Link from "next/link";
import { CircleAlert, QrCode, Receipt } from "lucide-react";
import { requireUser } from "@/modules/auth/guards";
import { INVOICE_STATUS, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { billingStats, getPaymentSettings, listInvoices } from "@/modules/billing/repository";
import { Badge, Table, fmtDate, td, th } from "@/shared/ui";

export default async function PortalHome() {
  const user = await requireUser("/portal");
  const [invoices, stats, pay] = await Promise.all([listInvoices({ userId: user.id }), billingStats(user.id), getPaymentSettings()]);
  const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification");

  return (
    <>
      <p className="hud-label mb-1">// halo, {user.name}</p>
      <h1 className="font-display text-2xl font-black tracking-wide">Tagihan <span className="text-gradient">Saya</span></h1>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Belum dibayar", fmtIDR(stats.unpaidTotal), `${stats.unpaid + stats.verifying} tagihan`],
          ["Menunggu verifikasi", String(stats.verifying), "bukti sudah diunggah"],
          ["Layanan aktif", String(stats.activeOrders), `${stats.pendingOrders} menunggu konfirmasi`],
        ].map(([k, v, s]) => (
          <div key={k} className="hud p-4">
            <p className="hud-label !text-[10px]">{k}</p>
            <p className="font-display mt-1 text-xl font-bold text-neon">{v}</p>
            <p className="text-xs text-slate-500">{s}</p>
          </div>
        ))}
      </div>

      {open.length > 0 && (
        <div className="hud mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-semibold text-white">Ada {open.length} tagihan yang perlu diselesaikan.</p>
              <p className="text-sm text-slate-400">Buka tagihan → scan QRIS{pay?.bankAccount ? " / transfer bank" : ""} → unggah bukti pembayaran. Status berubah otomatis setelah diverifikasi.</p>
            </div>
          </div>
          {pay?.qrisFileId && <Link href={`/portal/invoices/${open[0]!.id}`} className="btn-primary btn-sm shrink-0"><QrCode className="h-3.5 w-3.5" /> Bayar sekarang</Link>}
        </div>
      )}

      <section className="hud mt-6 p-0">
        <Table>
          <thead><tr><th className={th}>Nomor</th><th className={th}>Tagihan</th><th className={th}>Periode</th><th className={th}>Jatuh tempo</th><th className={th}>Nominal</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>
            {invoices.map((i) => {
              const late = isOverdue(i.dueDate, i.status);
              return (
                <tr key={i.id} className="hover:bg-white/5">
                  <td className={`${td} font-mono text-xs text-cyan-300`}>{i.number}</td>
                  <td className={td}>{i.title}</td>
                  <td className={td}>{fmtPeriod(i.period)}</td>
                  <td className={`${td} ${late ? "text-rose-300" : ""}`}>{fmtDate(i.dueDate)}{late && " · lewat"}</td>
                  <td className={`${td} font-semibold text-white`}>{fmtIDR(i.amount)}</td>
                  <td className={td}><Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge></td>
                  <td className={`${td} text-right`}><Link href={`/portal/invoices/${i.id}`} className="btn-ghost btn-sm"><Receipt className="h-3.5 w-3.5" /> {i.status === "unpaid" ? "Bayar" : "Detail"}</Link></td>
                </tr>
              );
            })}
            {!invoices.length && <tr><td className={td} colSpan={7}>Belum ada tagihan. Tagihan akan muncul setelah pesanan Anda dikonfirmasi.</td></tr>}
          </tbody>
        </Table>
      </section>
    </>
  );
}
