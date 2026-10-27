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
import { fmtDate, fmtDateTime } from "@/shared/ui";
import { Pill } from "../../ui";

export const metadata = { title: "Detail Tagihan" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/jasa/dashboard/tagihan/${id}`);
  const inv = await getInvoice(id);
  if (!inv || inv.userId !== user.id) notFound();
  const [pay, profile] = await Promise.all([getPaymentSettings(), getProfile()]);
  const st = INVOICE_STATUS[inv.status];
  const open = inv.status === "unpaid" || inv.status === "pending_verification";
  const phone = pay?.confirmPhone || profile?.phone || "";
  const wa = phone ? waLink(phone, `Halo, saya ${user.name}. Saya sudah membayar tagihan ${inv.number} (${inv.title}) sebesar ${fmtIDR(inv.amount)}. Mohon diverifikasi. Terima kasih.`) : null;

  return (
    <>
      <Link href="/jasa/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--ink-3)] hover:text-[var(--navy)]"><ArrowLeft className="h-3.5 w-3.5" /> Semua tagihan</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-[var(--navy-2)]">{inv.number}</p>
          <h1 className="font-serif mt-1 text-2xl font-semibold text-[var(--navy)] md:text-3xl">{inv.title}</h1>
          <p className="mt-2 text-sm text-[var(--ink-2)]">{inv.period ? `Periode ${fmtPeriod(inv.period)} · ` : ""}Jatuh tempo {fmtDate(inv.dueDate)}{isOverdue(inv.dueDate, inv.status) && <span className="font-semibold text-[#9b1c1c]"> · sudah lewat</span>}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-semibold text-[var(--navy)]">{fmtIDR(inv.amount)}</p>
          <div className="mt-1"><Pill tone={st.tone}>{st.label}</Pill></div>
        </div>
      </div>
      <section className="card mt-5 overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[#f3eee4]"><tr><th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Rincian</th><th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Nominal</th></tr></thead>
          <tbody>
            {(inv.items.length ? inv.items : [{ description: inv.title, amount: inv.amount }]).map((l, k) => (
              <tr key={k} className="border-t border-[var(--rule)]"><td className="px-5 py-2.5 text-[var(--ink)]">{l.description}</td><td className="px-5 py-2.5 text-right text-[var(--ink-2)]">{fmtIDR(l.amount)}</td></tr>
            ))}
            <tr className="border-t-2 border-[var(--navy)]"><td className="px-5 py-3 font-semibold text-[var(--navy)]">Total</td><td className="px-5 py-3 text-right font-serif text-lg font-semibold text-[var(--navy)]">{fmtIDR(inv.amount)}</td></tr>
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--rule)] bg-white/60 px-5 py-3">
          {inv.note ? <p className="text-xs text-[var(--ink-3)]">{inv.note}</p> : <span />}
          <a href={`/jasa/invoice/${inv.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><Printer className="h-3.5 w-3.5" /> Cetak / simpan PDF</a>
        </div>
      </section>

      {inv.status === "paid" && (
        <div className="alert-ok mt-6 flex items-center gap-3 rounded-xl p-5"><CircleCheck className="h-6 w-6" /> Lunas{inv.paidAt && ` · dikonfirmasi ${fmtDateTime(inv.paidAt)}`}. Terima kasih!</div>
      )}
      {inv.status === "cancelled" && <div className="card mt-6 p-5 text-[var(--ink-3)]">Tagihan ini dibatalkan.</div>}

      {open && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="font-serif flex items-center gap-2 text-lg font-semibold text-[var(--navy)]"><QrCode className="h-5 w-5 text-[var(--gold)]" /> 1. Bayar</h2>
            {pay?.qrisFileId ? (
              <div className="mt-4 rounded-xl border border-[var(--rule)] bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${pay.qrisFileId}`} alt="QRIS" className="mx-auto max-h-80 w-auto" />
                <p className="mt-3 text-center text-xs text-[var(--ink-2)]">Scan QRIS dengan aplikasi bank / e-wallet apa pun. Nominal: <b className="text-[var(--navy)]">{fmtIDR(inv.amount)}</b></p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[var(--ink-3)]">QRIS belum tersedia. Gunakan transfer bank di bawah atau hubungi kami.</p>
            )}
            {pay?.bankAccount && (
              <div className="mt-4 rounded-xl border border-[var(--rule)] bg-white p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Transfer bank</p>
                <p className="mt-1 font-semibold text-[var(--navy)]">{pay.bankName} · {pay.bankAccount}</p>
                <p className="text-[var(--ink-2)]">a.n. {pay.bankHolder}</p>
              </div>
            )}
            {pay?.instructions && <p className="mt-4 whitespace-pre-line text-xs text-[var(--ink-3)]">{pay.instructions}</p>}
          </section>

          <section className="card p-6">
            <h2 className="font-serif flex items-center gap-2 text-lg font-semibold text-[var(--navy)]"><FileUp className="h-5 w-5 text-[var(--gold)]" /> 2. Unggah bukti</h2>
            {inv.proofFileId && (
              <p className="mt-3 text-sm text-[var(--navy-2)]">
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
