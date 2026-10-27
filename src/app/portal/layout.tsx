import Link from "next/link";
import { LayoutDashboard, LogOut, Receipt, ShoppingCart, UserRound } from "lucide-react";
import { Starfield } from "@/components/starfield";
import { SERVICE_BRAND_FALLBACK, SERVICE_LOGO } from "@/components/site-header";
import { getPortfolio } from "@/modules/portfolio/service";
import { logoutToHomeAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";
import { isStaff } from "@/modules/auth/session";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal Pelanggan" };

const NAV = [
  ["/portal", "Tagihan", Receipt],
  ["/portal/orders", "Pesanan", ShoppingCart],
  ["/portal/account", "Akun", UserRound],
] as const;

/** Portal pelanggan: order, tagihan, pembayaran. Staf juga bisa membuka untuk uji coba. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/portal");
  const [flash, { profile }] = await Promise.all([readFlash(), getPortfolio()]);
  const brand = profile?.serviceBrand || SERVICE_BRAND_FALLBACK;
  return (
    <div className="relative min-h-screen">
      <Starfield />
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(3,6,18,0.72)] backdrop-blur-xl">
          <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3">
            <Link href="/jasa" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SERVICE_LOGO} alt="" className="h-8 w-8 rounded-md shadow-[0_0_16px_rgba(0,240,255,0.5)]" />
              <span className="font-display text-sm font-bold tracking-wider text-gradient">{brand}</span>
              <span className="hidden text-[10px] text-slate-500 sm:inline" style={{ fontFamily: "var(--font-mono)" }}>// portal pelanggan</span>
            </Link>
            <ul className="flex items-center gap-1 text-sm">
              {NAV.map(([href, label, Icon]) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-1.5 px-3 py-1.5 text-slate-300 transition hover:text-cyan-300"><Icon className="h-4 w-4" />{label}</Link>
                </li>
              ))}
              <li><Link href="/jasa#paket" className="btn-primary btn-sm ml-1">+ Order</Link></li>
            </ul>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline">{user.name}</span>
              {isStaff(user) && <Link href="/admin" className="btn-ghost btn-sm"><LayoutDashboard className="h-3.5 w-3.5" /> Admin</Link>}
              <form action={logoutToHomeAction}><button className="btn-ghost btn-sm"><LogOut className="h-3.5 w-3.5" /> Keluar</button></form>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-5 py-10">
          <Flash flash={flash} />
          {children}
        </main>
      </div>
    </div>
  );
}
