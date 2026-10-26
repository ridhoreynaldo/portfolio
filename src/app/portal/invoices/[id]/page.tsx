import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, FileUp, MessageCircle, QrCode } from "lucide-react";
import { z } from "zod";
import { requireUser } from "@/modules/auth/guards";
import { uploadProofAction } from "@/modules/billing/customer-actions";
import { INVOICE_STATUS, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { getInvoice, getPaymentSettings } from "@/modules/billing/repository";
import { getProfile } from "@/modules/content/repository";
import { waLink } from "@/shared/url";
import { Badge, fmtDate, fmtDateTime } from "@/shared/ui";

export const metadata = { title: "Detail Tagihan" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/portal/invoices/${id}`);
  const inv = await getInvoice(id);
  if (!inv || inv.userId !== user.id) notFound();
  const [pay, profile] = await Promise.all([getPaymentSettings(), getProfile()]);
  const st = INVOICE_STATUS[inv.status];
  const open = inv.status === "unpaid" || inv.status === "pending_verification";
  const phone = pay?.confirmPhone || profile?.phone || "";
  const wa = phone ? waLink(phone) : null;
  const waMsg = encodeURIComponent(`Halo, saya ${user.name}. Saya sudah membayar tagihan ${inv.number} (${inv.title}) sebesar ${fmtIDR(inv.amount)}. Mohon diverifikasi. Terima kasih.`);

  return (
    <>
      <Link href="/portal" className="hud-label mb-4 inline-flex items-center gap-1 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> semua tagihan</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-cyan-300">{inv.number}</p>
          <h1 className="font-display text-2xl font-black tracking-wide">{inv.title}</h1>
          <p className="mt-1 text-sm text-slate-400">{inv.period ? `Periode ${fmtPeriod(inv.period)} · ` : ""}Jatuh tempo {fmtDate(inv.dueDate)}{isOverdue(inv.dueDate, inv.status) && <span className="text-rose-300"> · sudah lewat</span>}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-bold text-neon">{fmtIDR(inv.amount)}</p>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>
      </div>
      {inv.note && <p className="hud mt-4 p-4 text-sm text-slate-300">{inv.note}</p>}

      {inv.status === "paid" && (
        <div className="hud mt-6 flex items-center gap-3 p-5 text-emerald-200"><CircleCheck className="h-6 w-6" /> Lunas{inv.paidAt && ` · dikonfirmasi ${fmtDateTime(inv.paidAt)}`}. Terima kasih!</div>
      )}
      {inv.status === "cancelled" && <div className="hud mt-6 p-5 text-slate-400">Tagihan ini dibatalkan.</div>}

      {open && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="hud p-6">
            <h2 className="font-display flex items-center gap-2 font-bold text-white"><QrCode className="h-5 w-5 text-cyan-300" /> 1. Bayar</h2>
            {pay?.qrisFileId ? (
              <div className="mt-4 bg-white p-3" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/files/${pay.qrisFileId}`} alt="QRIS" className="mx-auto max-h-80 w-auto" />
                <p className="mt-2 text-center text-[11px] text-slate-700">Scan QRIS dengan aplikasi bank / e-wallet apa pun. Nominal: <b>{fmtIDR(inv.amount)}</b></p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">QRIS belum tersedia.</p>
            )}
            {pay?.bankAccount && (
              <div className="mt-4 border border-white/10 p-3 text-sm">
                <p className="hud-label !text-[10px]">transfer bank</p>
                <p className="mt-1 font-semibold text-white">{pay.bankName} · {pay.bankAccount}</p>
                <p className="text-slate-400">a.n. {pay.bankHolder}</p>
              </div>
            )}
            {pay?.instructions && <p className="mt-4 whitespace-pre-line text-xs text-slate-400">{pay.instructions}</p>}
          </section>

          <section className="hud p-6">
            <h2 className="font-display flex items-center gap-2 font-bold text-white"><FileUp className="h-5 w-5 text-cyan-300" /> 2. Unggah bukti</h2>
            {inv.proofFileId && (
              <p className="mt-3 text-sm text-cyan-200">
                Bukti terkirim {inv.proofUploadedAt && fmtDateTime(inv.proofUploadedAt)} · <a href={`/api/files/${inv.proofFileId}`} target="_blank" rel="noreferrer" className="underline">lihat</a>
                {inv.status === "pending_verification" && <span className="text-slate-400"> — menunggu verifikasi admin. Anda bisa mengunggah ulang bila salah.</span>}
              </p>
            )}
            <form action={uploadProofAction} className="mt-4 space-y-3">
              <input type="hidden" name="invoiceId" value={inv.id} />
              <input name="proof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required className="input-dark" />
              <p className="text-xs text-slate-500">JPG / PNG / WebP / PDF, maks. 3 MB.</p>
              <button className="btn-primary w-full">Kirim bukti pembayaran</button>
            </form>
            {wa && (
              <a href={`${wa}?text=${waMsg}`} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full"><MessageCircle className="h-4 w-4" /> Konfirmasi via WhatsApp</a>
            )}
          </section>
        </div>
      )}
    </>
  );
}
