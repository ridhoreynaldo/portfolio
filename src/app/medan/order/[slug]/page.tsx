import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LogIn, MessageCircle, Send } from "lucide-react";
import { PriceTierTable, ServiceFooter, ServiceHeader, SERVICE_BRAND } from "@/components/service-shell";
import { getCurrentUser } from "@/modules/auth/session";
import { placeOrderAction } from "@/modules/billing/customer-actions";
import { CYCLE, fmtIDR, tierRange } from "@/modules/billing/labels";
import { getPackageBySlug } from "@/modules/billing/repository";
import { getPortfolio } from "@/modules/portfolio/service";
import { readFlash } from "@/shared/action";
import { waLink } from "@/shared/url";
import { Flash } from "@/components/lc/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const pkg = await getPackageBySlug((await params).slug);
  return { title: pkg ? pkg.name : "Paket", description: pkg?.description };
}

/** Detail paket (publik): deskripsi, fitur, tabel harga. Form pemesanan tampil setelah login (aksinya juga mewajibkan login). */
export default async function PackagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();
  const [user, { profile }, flash] = await Promise.all([getCurrentUser(), getPortfolio(), readFlash()]);
  const brand = SERVICE_BRAND;
  const per = `${CYCLE[pkg.billingCycle]}${pkg.unit ? ` / ${pkg.unit}` : ""}`;
  const wa = profile?.phone ? waLink(profile.phone, `Halo ${brand.name}, saya tertarik dengan paket "${pkg.name}". Boleh minta penawaran harganya?`) : null;
  const next = encodeURIComponent(`/order/${slug}`);

  return (
    <div className="svc">
      <ServiceHeader brand={brand} user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <Link href="/#paket" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ink-3)] hover:text-[var(--brand-ink)]"><ArrowLeft className="h-3.5 w-3.5" /> Semua paket</Link>
        <div className="mt-4"><Flash flash={flash} /></div>

        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Info paket */}
          <section>
            <p className="eyebrow">{pkg.category}</p>
            <h1 className="mt-2 text-[1.75rem] font-bold leading-tight text-[var(--ink)] md:text-4xl">{pkg.name}</h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-[var(--ink-2)]">{pkg.description}</p>

            {pkg.features.length > 0 && (
              <div className="card mt-6 p-4 md:p-6">
                <h2 className="font-bold text-[var(--ink)]">Yang termasuk</h2>
                <ul className="mt-3 grid gap-2 text-sm text-[var(--ink-2)] sm:grid-cols-2">{pkg.features.map((f) => <li key={f} className="check">{f}</li>)}</ul>
              </div>
            )}

            {pkg.priceTiers.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 font-bold text-[var(--ink)]">Estimasi harga per tingkat</h2>
                <PriceTierTable tiers={pkg.priceTiers} cycle={CYCLE[pkg.billingCycle]} unit={pkg.unit} />
              </div>
            )}
          </section>

          {/* Harga + pesan */}
          <aside className="h-fit lg:sticky lg:top-24">
            <div className="card p-4 md:p-6">
              <p className="text-xs text-[var(--ink-3)]">{pkg.priceTiers.length ? "Kisaran harga" : "Harga"}</p>
              <p className="text-2xl font-bold text-[var(--ink)]">
                {pkg.priceTiers.length ? tierRange(pkg.priceTiers) : profile?.showServicePrices && pkg.price > 0 ? fmtIDR(pkg.price) : "Sesuai kebutuhan"}
              </p>
              <p className="text-xs text-[var(--ink-3)]">{per} · harga pasti setelah diskusi</p>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full"><MessageCircle className="h-4 w-4" /> Tanya harga via WhatsApp</a>}

              <hr className="my-5 border-[var(--line)]" />

              {user ? (
                <form action={placeOrderAction} className="space-y-4">
                  <input type="hidden" name="slug" value={pkg.slug} />
                  <p className="font-bold text-[var(--ink)]">Pesan lewat dashboard</p>
                  <p className="text-xs text-[var(--ink-3)]">Sebagai {user.name} · {user.email}</p>
                  {pkg.unit && (
                    <div>
                      <label className="label" htmlFor="quantity">Jumlah ({pkg.unit})</label>
                      <input id="quantity" name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark max-w-[10rem]" />
                    </div>
                  )}
                  <div>
                    <label className="label" htmlFor="notes">Ceritakan kebutuhan Anda</label>
                    <textarea id="notes" name="notes" rows={5} maxLength={3000} className="input-dark" placeholder={pkg.priceTiers.length > 0 ? "Perkiraan jumlah pengguna / volume pesan, tujuan, tenggat waktu, kontak terbaik." : "Tujuan, fitur utama, tenggat waktu, referensi, kontak terbaik."} />
                  </div>
                  <button className="btn-ghost w-full">Kirim pesanan <Send className="h-4 w-4" /></button>
                  <p className="text-xs text-[var(--ink-3)]">Pesanan berstatus <b>menunggu konfirmasi</b>. Kami menghubungi Anda sebelum tagihan dibuat.</p>
                </form>
              ) : (
                <div>
                  <p className="font-bold text-[var(--ink)]">Atau pesan lewat dashboard</p>
                  <p className="mt-1 text-sm text-[var(--ink-3)]">Masuk untuk mengirim pesanan, lalu pantau tagihan dan bayar via QRIS.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/login?next=${next}`} className="btn-ghost btn-sm"><LogIn className="h-3.5 w-3.5" /> Login</Link>
                    <Link href={`/register?next=${next}`} className="btn-ghost btn-sm">Daftar</Link>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
      <ServiceFooter brand={brand} wa={wa} />
    </div>
  );
}
