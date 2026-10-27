import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { ServiceFooter, ServiceHeader, serviceBrandOf } from "@/components/service-shell";
import { requireUser } from "@/modules/auth/guards";
import { placeOrderAction } from "@/modules/billing/customer-actions";
import { CYCLE, fmtIDR } from "@/modules/billing/labels";
import { getPackageBySlug } from "@/modules/billing/repository";
import { getPortfolio } from "@/modules/portfolio/service";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Form Pemesanan" };

export default async function OrderFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();
  const user = await requireUser(`/order/${slug}`); // belum login → /login?next=… (ada tautan daftar)
  const [{ profile }, flash] = await Promise.all([getPortfolio(), readFlash()]);
  const brand = serviceBrandOf(profile);

  return (
    <div className="svc">
      <ServiceHeader brand={brand} user={user} />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <Link href="/jasa#paket" className="inline-flex items-center gap-1 text-sm text-[var(--ink-3)] hover:text-[var(--navy)]"><ArrowLeft className="h-3.5 w-3.5" /> Kembali ke paket</Link>
        <p className="eyebrow mt-5">Form pemesanan</p>
        <h1 className="font-serif mt-2 text-3xl font-semibold text-[var(--navy)] md:text-4xl">{pkg.name}</h1>
        <div className="mt-4"><Flash flash={flash} /></div>
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
          <form action={placeOrderAction} className="card space-y-5 p-6 md:p-8">
            <input type="hidden" name="slug" value={pkg.slug} />
            <div>
              <p className="label">Pemesan</p>
              <p className="text-sm text-[var(--ink)]">{user.name} <span className="text-[var(--ink-3)]">· {user.email}</span></p>
            </div>
            {pkg.unit && (
              <div>
                <label className="label" htmlFor="quantity">Jumlah ({pkg.unit})</label>
                <input id="quantity" name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark max-w-[10rem]" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="notes">Ceritakan kebutuhan Anda</label>
              <textarea id="notes" name="notes" rows={7} maxLength={3000} className="input-dark" placeholder={"Tujuan aplikasi/layanan, fitur utama, tenggat waktu, referensi, dan cara terbaik menghubungi Anda (WhatsApp/email)."} />
            </div>
            <p className="text-xs text-[var(--ink-3)]">Setelah dikirim, pesanan berstatus <b>menunggu konfirmasi</b>. Saya akan menghubungi Anda sebelum tagihan dibuat.</p>
            <button className="btn-primary">Kirim pesanan <Send className="h-4 w-4" /></button>
          </form>
          <aside className="card h-fit p-6">
            <p className="eyebrow">{pkg.category}</p>
            <h2 className="font-serif mt-2 text-xl font-semibold text-[var(--navy)]">{pkg.name}</h2>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{pkg.description}</p>
            <p className="font-serif mt-5 text-2xl font-semibold text-[var(--navy)]">{pkg.price > 0 ? fmtIDR(pkg.price) : "Hubungi"}</p>
            <p className="text-xs text-[var(--ink-3)]">{pkg.price > 0 ? CYCLE[pkg.billingCycle] : "harga mengikuti scope"}{pkg.unit && ` / ${pkg.unit}`}</p>
            {pkg.features.length > 0 && <ul className="mt-4 space-y-2 text-sm text-[var(--ink-2)]">{pkg.features.map((f) => <li key={f} className="check">{f}</li>)}</ul>}
          </aside>
        </div>
      </main>
      <ServiceFooter brand={brand} />
    </div>
  );
}
