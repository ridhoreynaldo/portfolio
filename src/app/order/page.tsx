import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Handshake, ShieldCheck, Wallet } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/modules/auth/session";
import { CYCLE, fmtIDR } from "@/modules/billing/labels";
import { getPortfolio } from "@/modules/portfolio/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order Jasa" };

/** Katalog jasa/sewa. Memesan butuh login (akun pelanggan gratis). */
export default async function OrderPage() {
  const [{ profile, menus, packages }, user] = await Promise.all([getPortfolio(), getCurrentUser()]);
  const groups = Object.entries(packages.reduce<Record<string, typeof packages>>((acc, s) => ((acc[s.category] ??= []).push(s), acc), {}));
  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <SiteHeader brand={profile?.siteName || profile?.fullName || "Portfolio"} menus={menus} user={user} />
        <main className="mx-auto max-w-6xl px-5 py-14">
          <p className="hud-label mb-2"><span className="text-magenta">[order]</span> // katalog layanan</p>
          <h1 className="font-display text-3xl font-black tracking-wide md:text-4xl">Pesan <span className="text-gradient">Jasa & Sewa</span></h1>
          <p className="mt-3 max-w-2xl text-slate-300/85">Pilih paket, isi kebutuhan Anda, lalu saya konfirmasi lewat WhatsApp/email. Tagihan (sekali atau bulanan) muncul di portal pelanggan dan bisa dibayar via QRIS atau transfer bank.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [<Handshake key="a" className="h-5 w-5 text-cyan-300" />, "1. Pilih & pesan", "Daftar akun pelanggan (gratis), pilih paket, tulis brief kebutuhan."],
              [<ShieldCheck key="b" className="h-5 w-5 text-cyan-300" />, "2. Konfirmasi", "Saya hubungi Anda untuk detail scope, jadwal, dan harga final."],
              [<Wallet key="c" className="h-5 w-5 text-cyan-300" />, "3. Bayar via portal", "Tagihan tampil di akun Anda: scan QRIS, unggah bukti, status otomatis diperbarui."],
            ].map(([icon, t, d], i) => (
              <div key={i} className="hud p-4">
                <div className="flex items-center gap-2 font-display text-sm font-bold text-white">{icon}{t}</div>
                <p className="mt-1.5 text-xs text-slate-400">{d}</p>
              </div>
            ))}
          </div>

          {groups.length === 0 && <p className="hud mt-10 p-8 text-center text-slate-400">Belum ada paket layanan yang aktif.</p>}
          {groups.map(([cat, list]) => (
            <section key={cat} className="mt-12">
              <h2 className="hud-label mb-4 !text-fuchsia-300">// {cat}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <article key={s.id} className={`hud flex flex-col p-6 ${s.isFeatured ? "!border-fuchsia-400/50" : ""}`}>
                    {s.isFeatured && <span className="chip chip-magenta mb-3 self-start">★ populer</span>}
                    <h3 className="font-display text-base font-bold text-white">{s.name}</h3>
                    <p className="mt-2 text-sm text-slate-300/80">{s.description}</p>
                    {s.features.length > 0 && (
                      <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                        {s.features.map((f) => <li key={f} className="flex gap-2"><span className="text-cyan-300">▸</span>{f}</li>)}
                      </ul>
                    )}
                    <div className="mt-auto pt-5">
                      <p className="font-display text-xl font-bold text-neon">{s.price > 0 ? fmtIDR(s.price) : "Hubungi"}</p>
                      <p className="hud-label !text-[10px] !text-slate-500">{s.price > 0 ? CYCLE[s.billingCycle] : "harga mengikuti scope"}{s.unit && ` / ${s.unit}`}</p>
                      <Link href={`/order/${s.slug}`} className="btn-primary btn-sm mt-4 w-full">Pesan paket ini <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
        <SiteFooter name={profile?.fullName || "Portfolio"} />
      </div>
    </div>
  );
}
