import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { SiteFooter, SiteHeader } from "@/components/site-header";
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
  const [{ profile, menus }, flash] = await Promise.all([getPortfolio(), readFlash()]);

  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <SiteHeader brand={profile?.siteName || profile?.fullName || "Portfolio"} menus={menus} user={user} />
        <main className="mx-auto max-w-3xl px-5 py-14">
          <Link href="/order" className="hud-label mb-4 inline-flex items-center gap-1 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> kembali ke katalog</Link>
          <h1 className="font-display text-2xl font-black tracking-wide md:text-3xl">Pesan: <span className="text-gradient">{pkg.name}</span></h1>
          <Flash flash={flash} />
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
            <form action={placeOrderAction} className="hud space-y-4 p-6">
              <input type="hidden" name="slug" value={pkg.slug} />
              <div>
                <p className="label">Pemesan</p>
                <p className="text-sm text-slate-200">{user.name} <span className="text-slate-500">· {user.email}</span></p>
              </div>
              {pkg.unit && (
                <div>
                  <label className="label" htmlFor="quantity">Jumlah ({pkg.unit})</label>
                  <input id="quantity" name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark max-w-[10rem]" />
                </div>
              )}
              <div>
                <label className="label" htmlFor="notes">Brief kebutuhan</label>
                <textarea id="notes" name="notes" rows={7} maxLength={3000} className="input-dark" placeholder={"Ceritakan kebutuhan Anda: tujuan aplikasi/layanan, fitur utama, tenggat waktu, referensi, dan cara terbaik menghubungi Anda (WhatsApp/email)."} />
              </div>
              <p className="text-xs text-slate-500">Setelah dikirim, pesanan berstatus <b>menunggu konfirmasi</b>. Saya akan menghubungi Anda sebelum tagihan dibuat.</p>
              <button className="btn-primary">Kirim pesanan <Send className="h-4 w-4" /></button>
            </form>
            <aside className="hud h-fit p-5">
              <p className="hud-label !text-fuchsia-300">{pkg.category}</p>
              <h2 className="font-display mt-1 font-bold text-white">{pkg.name}</h2>
              <p className="mt-2 text-sm text-slate-400">{pkg.description}</p>
              <p className="font-display mt-4 text-xl font-bold text-neon">{pkg.price > 0 ? fmtIDR(pkg.price) : "Hubungi"}</p>
              <p className="hud-label !text-[10px] !text-slate-500">{pkg.price > 0 ? CYCLE[pkg.billingCycle] : "harga mengikuti scope"}{pkg.unit && ` / ${pkg.unit}`}</p>
              {pkg.features.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                  {pkg.features.map((f) => <li key={f} className="flex gap-2"><span className="text-cyan-300">▸</span>{f}</li>)}
                </ul>
              )}
            </aside>
          </div>
        </main>
        <SiteFooter name={profile?.fullName || "Portfolio"} />
      </div>
    </div>
  );
}
