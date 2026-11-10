import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, FileUp, MessageCircle, Printer, QrCode } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/modules/auth/guards";
import { uploadProofAction } from "@/modules/billing/customer-actions";
import { INVOICE_STATUS, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { getInvoice, getPaymentSettings } from "@/modules/billing/repository";
import { getProfile } from "@/modules/content/repository";
import { waLink } from "@/shared/url";
import { fmtDate, fmtDateTime } from "@/components/lc/ui";
import { ZoomImage } from "@/components/lc/zoom-image";
import { Pill } from "../../ui";

export const metadata = { title: "Detail Tagihan" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const user = await requireUser(`/dashboard/tagihan/${id}`);
  const inv = await getInvoice(id);
  if (!inv || inv.userId !== user.id) notFound();
  const [pay, profile] = await Promise.all([getPaymentSettings(), getProfile()]);
  const st = INVOICE_STATUS[inv.status];
  const open = inv.status === "unpaid" || inv.status === "pending_verification";
  const phone = pay?.confirmPhone || profile?.phone || "";
  const wa = phone ? waLink(phone, `Halo, saya ${user.name}. Saya sudah membayar tagihan ${inv.number} (${inv.title}) sebesar ${fmtIDR(inv.amount)}. Mohon diverifikasi. Terima kasih.`) : null;

  return (
    <>
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--brand-ink)]"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke ringkasan</Link>

      <section className="card mt-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between md:p-6">
          <div className="min-w-0">
            <p className="font-mono text-xs text-[var(--ink-3)]">{inv.number}</p>
            <h1 className="mt-1 text-xl font-bold text-[var(--ink)] md:text-2xl">{inv.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{inv.period ? `Periode ${fmtPeriod(inv.period)} · ` : ""}Jatuh tempo {fmtDate(inv.dueDate)}{isOverdue(inv.dueDate, inv.status) && <span className="font-semibold text-[var(--bad)]"> · sudah lewat</span>}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-2xl font-bold text-[var(--ink)] md:text-3xl">{fmtIDR(inv.amount)}</p>
            <div className="mt-1"><Pill tone={st.tone}>{st.label}</Pill></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Rincian</th><th className="!text-right">Nominal</th></tr></thead>
            <tbody>
              {(inv.items.length ? inv.items : [{ description: inv.title, amount: inv.amount }]).map((l, k) => (
                <tr key={k}><td className="text-[var(--ink)]"><span className="mr-1.5 text-[var(--ink-3)]">{k + 1}.</span>{l.description}{"note" in l && l.note && <span className="mt-0.5 block text-xs text-[var(--ink-3)]">{l.note}</span>}</td><td className="whitespace-nowrap text-right text-[var(--ink-2)]">{fmtIDR(l.amount)}</td></tr>
              ))}
              <tr><td className="font-bold text-[var(--ink)]">Total</td><td className="whitespace-nowrap text-right text-base font-bold text-[var(--ink)]">{fmtIDR(inv.amount)}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-3 md:px-6">
          {inv.note ? <p className="text-xs text-[var(--ink-3)]">{inv.note}</p> : <span />}
          <a href={`/invoice/${inv.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Printer className="h-3.5 w-3.5" /> Cetak / PDF</a>
        </div>
      </section>

      {inv.status === "paid" && (
        <div className="alert-ok mt-6 flex items-center gap-3 p-4"><CircleCheck className="h-6 w-6" /> Sudah bayar{inv.paidAt && ` · dikonfirmasi ${fmtDateTime(inv.paidAt)}`}. Terima kasih!</div>
      )}
      {inv.status === "cancelled" && <div className="card mt-6 p-5 text-[var(--ink-3)]">Tagihan ini dibatalkan.</div>}

      {open && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="card p-4 md:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--ink)]"><QrCode className="h-5 w-5 text-[var(--brand-ink)]" /> 1. Bayar</h2>
            {pay?.qrisFileId ? (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
                <ZoomImage src={`/api/files/${pay.qrisFileId}`} alt="QRIS" className="mx-auto max-h-80 w-auto" />
                <p className="mt-3 text-center text-xs text-[#46544d]">Scan QRIS dengan aplikasi bank / e-wallet apa pun. Nominal: <b className="text-[#17231e]">{fmtIDR(inv.amount)}</b></p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--ink-3)]">QRIS belum tersedia. Gunakan transfer bank di bawah atau hubungi kami.</p>
            )}
            {pay?.bankAccount && (
              <div className="mt-4 rounded-xl bg-[var(--surface-2)] p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Transfer bank</p>
                <p className="mt-1 font-semibold text-[var(--ink)]">{pay.bankName} · {pay.bankAccount}</p>
                <p className="text-[var(--ink-2)]">a.n. {pay.bankHolder}</p>
              </div>
            )}
            {pay?.instructions && <p className="mt-4 whitespace-pre-line text-xs text-[var(--ink-3)]">{pay.instructions}</p>}
          </section>

          <section className="card p-4 md:p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-[var(--ink)]"><FileUp className="h-5 w-5 text-[var(--brand-ink)]" /> 2. Unggah bukti</h2>
            {inv.proofFileId && (
              <p className="mt-3 text-sm text-[var(--brand-ink)]">
                Bukti terkirim {inv.proofUploadedAt && fmtDateTime(inv.proofUploadedAt)} · <a href={`/api/files/${inv.proofFileId}`} target="_blank" rel="noreferrer" className="underline">lihat</a>
                {inv.status === "pending_verification" && <span className="text-[var(--ink-3)]"> — menunggu verifikasi admin. Anda bisa mengunggah ulang bila salah.</span>}
              </p>
            )}
            <form action={uploadProofAction} className="mt-4 space-y-3">
              <input type="hidden" name="invoiceId" value={inv.id} />
              <input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="input-dark" />
              <p className="text-xs text-[var(--ink-3)]">JPG / PNG / WebP / PDF, maks. 3 MB.</p>
              <button className="btn-primary w-full">Kirim bukti pembayaran</button>
            </form>
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full"><MessageCircle className="h-4 w-4" /> Konfirmasi via WhatsApp</a>}
          </section>
        </div>
      )}
    </>
  );
}
