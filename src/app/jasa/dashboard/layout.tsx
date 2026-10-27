import Link from "next/link";
import { LayoutDashboard, LogOut, Server, UserRound } from "lucide-react";
import { SERVICE_LOGO, serviceBrandOf, ServiceFooter } from "@/components/service-shell";
import { getPortfolio } from "@/modules/portfolio/service";
import { logoutToHomeAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";
import { isStaff } from "@/modules/auth/session";
import { readFlash } from "@/shared/action";
import { Flash } from "@/shared/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Pelanggan" };

const NAV = [
  ["/jasa/dashboard", "Langganan", Server],
  ["/jasa/dashboard/akun", "Akun", UserRound],
] as const;

/** Dashboard pelanggan Kodeva (tema klasik terang, sama dengan halaman jasa): langganan, tagihan, pembayaran. Staf juga bisa membuka untuk uji coba. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/jasa/dashboard");
  const [flash, { profile }] = await Promise.all([readFlash(), getPortfolio()]);
  const brand = serviceBrandOf(profile);
  return (
    <div className="svc flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[rgba(250,247,241,0.9)] backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href="/jasa/dashboard" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SERVICE_LOGO} alt="" className="h-9 w-9" />
            <span className="leading-tight">
              <span className="font-serif block text-lg font-semibold tracking-wide text-[var(--navy)]">{brand.name}</span>
              <span className="block text-[11px] text-[var(--ink-3)]">Dashboard pelanggan</span>
            </span>
          </Link>
          <ul className="order-3 flex w-full items-center gap-1 overflow-x-auto border-t border-[var(--rule)] pt-2 text-sm md:order-none md:w-auto md:border-0 md:pt-0">
            {NAV.map(([href, label, Icon]) => (
              <li key={href}>
                <Link href={href} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-[var(--ink-2)] transition hover:bg-white hover:text-[var(--navy)]"><Icon className="h-4 w-4" />{label}</Link>
              </li>
            ))}
            <li><Link href="/jasa#paket" className="btn-primary btn-sm ml-1">+ Sewa / pesan</Link></li>
          </ul>
          <div className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
            <span className="hidden sm:inline">{user.name}</span>
            {isStaff(user) && <Link href="/admin" className="btn-ghost btn-sm"><LayoutDashboard className="h-3.5 w-3.5" /> Admin</Link>}
            <form action={logoutToHomeAction}><button className="btn-ghost btn-sm"><LogOut className="h-3.5 w-3.5" /> Keluar</button></form>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <Flash flash={flash} />
        {children}
      </main>
      <ServiceFooter brand={brand} />
    </div>
  );
}
