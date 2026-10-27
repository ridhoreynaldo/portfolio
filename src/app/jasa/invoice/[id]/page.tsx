import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SERVICE_LOGO, serviceBrandOf } from "@/components/service-shell";
import { requireUser } from "@/modules/auth/guards";
import { isStaff } from "@/modules/auth/session";
import { INVOICE_STATUS, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { getCustomerProfile, getInvoice, getOrder, getPaymentSettings } from "@/modules/billing/repository";
import { getPortfolio } from "@/modules/portfolio/service";
import { fmtDate } from "@/shared/ui";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Invoice" };

/** Lembar invoice siap cetak (A4) — untuk pemilik tagihan dan staf. Tanpa header/nav dashboard. */
export default async function InvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const user = await requireUser(`/jasa/invoice/${id}`);
  const inv = await getInvoice(id);
  if (!inv || (inv.userId !== user.id && !isStaff(user))) notFound();
  const [{ profile }, pay, cust, order] = await Promise.all([getPortfolio(), getPaymentSettings(), getCustomerProfile(inv.userId), inv.orderId ? getOrder(inv.orderId) : Promise.resolve(undefined)]);
  const brand = serviceBrandOf(profile);
  const lines = inv.items.length ? inv.items : [{ description: inv.title, amount: inv.amount }];
  const st = INVOICE_STATUS[inv.status];
  const paidDate = inv.paidAt ? fmtDate(new Date(inv.paidAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10)) : null;

  return (
    <div className="svc min-h-screen print:bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 pt-6 print:hidden">
        <Link href={isStaff(user) && inv.userId !== user.id ? "/admin/invoices" : `/jasa/dashboard/tagihan/${inv.id}`} className="text-sm text-[var(--ink-3)] hover:text-[var(--navy)]">← Kembali</Link>
        <PrintButton />
      </div>

      <article className="mx-auto my-6 max-w-3xl bg-white p-8 shadow-[0_20px_60px_-30px_rgba(20,33,61,0.35)] print:my-0 print:max-w-none print:p-0 print:shadow-none md:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[var(--navy)] pb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SERVICE_LOGO} alt="" className="h-14 w-14" />
            <div>
              <p className="font-serif text-2xl font-semibold tracking-wide text-[var(--navy)]">{brand.name}</p>
              <p className="text-xs text-[var(--ink-3)]">{brand.tagline}</p>
              <p className="mt-1 text-xs text-[var(--ink-2)]">{brand.owner}{profile?.location ? ` · ${profile.location}` : ""}{profile?.phone ? ` · ${profile.phone}` : ""}{profile?.email ? ` · ${profile.email}` : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-serif text-3xl font-semibold uppercase tracking-widest text-[var(--navy)]">Invoice</p>
            <p className="font-mono text-sm text-[var(--ink-2)]">{inv.number}</p>
            <p className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${inv.status === "paid" ? "bg-[#e5f6ea] text-[#14532d]" : inv.status === "cancelled" ? "bg-[#efeae0] text-[#5b6472]" : "bg-[#fbf1d9] text-[#7a5a0f]"}`}>{inv.status === "paid" && paidDate ? `LUNAS · ${paidDate}` : st.label.toUpperCase()}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Ditagihkan kepada</p>
            <p className="mt-1 font-semibold text-[var(--navy)]">{cust?.company || inv.customerName}</p>
            {cust?.company && <p className="text-[var(--ink-2)]">a.n. {inv.customerName}</p>}
            <p className="text-[var(--ink-2)]">{inv.customerEmail}{cust?.phone ? ` · ${cust.phone}` : ""}</p>
            {cust?.address && <p className="whitespace-pre-line text-[var(--ink-2)]">{cust.address}</p>}
          </div>
          <div className="sm:text-right">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:justify-end">
              <dt className="text-[var(--ink-3)]">Tanggal invoice</dt><dd className="text-[var(--ink)]">{fmtDate(inv.createdAt.toISOString().slice(0, 10))}</dd>
              <dt className="text-[var(--ink-3)]">Jatuh tempo</dt><dd className="text-[var(--ink)]">{fmtDate(inv.dueDate)}</dd>
              {inv.period && <><dt className="text-[var(--ink-3)]">Periode</dt><dd className="text-[var(--ink)]">{fmtPeriod(inv.period)}</dd></>}
              {order && <><dt className="text-[var(--ink-3)]">Order</dt><dd className="font-mono text-xs text-[var(--ink)]">{order.number}</dd></>}
              {paidDate && <><dt className="text-[var(--ink-3)]">Dibayar</dt><dd className="font-semibold text-[#14532d]">{paidDate}</dd></>}
            </dl>
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="bg-[var(--navy)] text-white">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">#</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider">Deskripsi</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, k) => (
              <tr key={k} className="border-b border-[var(--rule)]">
                <td className="px-4 py-3 text-[var(--ink-3)]">{k + 1}</td>
                <td className="px-4 py-3 text-[var(--ink)]">{l.description}</td>
                <td className="px-4 py-3 text-right text-[var(--ink)]">{fmtIDR(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="px-4 pt-4 text-right font-semibold text-[var(--navy)]">Total</td>
              <td className="px-4 pt-4 text-right font-serif text-xl font-semibold text-[var(--navy)]">{fmtIDR(inv.amount)}</td>
            </tr>
          </tfoot>
        </table>

        {order && (order.items.length > 0 || order.itemLimit != null) && (
          <section className="mt-6 rounded-xl border border-[var(--rule)] p-4 text-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Cakupan langganan{order.itemLimit != null && ` · ${order.items.length}/${order.itemLimit} ${order.itemLabel || "item"}`}</p>
            <p className="mt-1 font-mono text-xs text-[var(--ink-2)]">{order.items.join(" · ")}</p>
            {order.endDate && <p className="mt-1 text-xs text-[var(--ink-3)]">Berlaku s.d. {fmtDate(order.endDate)}.</p>}
          </section>
        )}

        {inv.note && <p className="mt-6 text-sm text-[var(--ink-2)]"><span className="font-semibold text-[var(--navy)]">Catatan:</span> {inv.note}</p>}

        {inv.status !== "paid" && inv.status !== "cancelled" && (
          <section className="mt-6 grid gap-4 border-t border-[var(--rule)] pt-6 text-sm sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">Cara pembayaran</p>
              {pay?.bankAccount && <p className="mt-1 text-[var(--ink)]">Transfer <b>{pay.bankName}</b> {pay.bankAccount}{pay.bankHolder && ` a.n. ${pay.bankHolder}`}</p>}
              <p className="text-[var(--ink-2)]">Atau scan QRIS di samping, lalu unggah bukti pembayaran di dashboard pelanggan.</p>
              {pay?.instructions && <p className="mt-1 whitespace-pre-line text-xs text-[var(--ink-3)]">{pay.instructions}</p>}
            </div>
            {pay?.qrisFileId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/files/${pay.qrisFileId}`} alt="QRIS" className="h-36 w-36 object-contain" />
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-[var(--rule)] pt-4 text-center text-[11px] text-[var(--ink-3)]">
          {brand.name} · dikelola oleh {brand.owner} · Invoice ini dibuat otomatis dari dashboard pelanggan dan sah tanpa tanda tangan.
        </footer>
      </article>
    </div>
  );
}
