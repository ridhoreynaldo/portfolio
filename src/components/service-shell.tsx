import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import type { AuthUser } from "@/modules/auth/session";
import { fmtIDR } from "@/modules/billing/labels";
import type { PriceTier } from "@/modules/billing/schema";

/** Logo brand (SVG di public/). */
export const SERVICE_LOGO = "/service-logo.svg";

export type ServiceBrand = { name: string; tagline: string; area: string };
/** Identitas brand tetap (tidak diambil dari profil pribadi). */
export const SERVICE_BRAND: ServiceBrand = {
  name: "Leetcloud",
  tagline: "Aplikasi, server & WhatsApp gateway untuk bisnis Anda",
  area: "Medan",
};

const NAV = [
  ["/medan#paket", "Paket"],
  ["/medan#proyek", "Proyek"],
  ["/medan#cara-kerja", "Cara Kerja"],
  ["/medan#kontak", "Kontak"],
] as const;

/** Header halaman layanan (tema svc, terang & klasik). */
export function ServiceHeader({ brand, user }: { brand: ServiceBrand; user: AuthUser | null }) {
  const staff = !!user && (user.isSuper || user.permissions.length > 0);
  const portal = user ? (staff ? "/admin" : "/medan/dashboard") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--hdr)] backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href="/medan" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SERVICE_LOGO} alt="" className="h-10 w-10" />
          <span className="leading-tight">
            <span className="font-serif block text-xl font-semibold tracking-wide text-[var(--navy)]">{brand.name}</span>
            <span className="block text-[11px] text-[var(--ink-3)]">Layanan IT · {brand.area}</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-2)] md:flex">
          {NAV.map(([href, label]) => <li key={href}><a href={href} className="transition hover:text-[var(--navy)]">{label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          {portal ? (
            <Link href={portal} className="btn-ghost btn-sm" title={staff ? "Dashboard admin" : "Dashboard pelanggan"}><UserRound className="h-3.5 w-3.5" /> Dashboard</Link>
          ) : (
            <Link href="/medan/login" className="btn-ghost btn-sm"><LogIn className="h-3.5 w-3.5" /> Login</Link>
          )}
          <Link href="/medan#paket" className="btn-primary btn-sm">Pesan</Link>
        </div>
      </nav>
    </header>
  );
}

export function ServiceFooter({ brand }: { brand: ServiceBrand }) {
  return (
    <footer className="border-t border-[var(--rule)] bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-center text-xs text-[var(--ink-3)] md:flex-row md:text-left">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SERVICE_LOGO} alt="" className="h-7 w-7" />
          <span><span className="font-serif text-sm font-semibold text-[var(--navy)]">{brand.name}</span> · {brand.tagline}</span>
        </div>
        <p>© {new Date().getFullYear()} {brand.name} · {brand.area}, Indonesia</p>
      </div>
    </footer>
  );
}

/** Blok identitas brand untuk halaman kecil (login/daftar). */
export function ServiceBrandMark({ brand, title, sub }: { brand: ServiceBrand; title: string; sub: string }) {
  return (
    <div className="mb-6 text-center">
      <Link href="/medan" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_LOGO} alt="" className="mx-auto h-14 w-14" />
      </Link>
      <p className="font-serif mt-3 text-lg font-semibold tracking-wide text-[var(--navy)]">{brand.name}</p>
      <p className="text-[11px] text-[var(--ink-3)]">Layanan IT · {brand.area}</p>
      <h1 className="font-serif mt-5 text-2xl font-semibold text-[var(--ink)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-3)]">{sub}</p>
    </div>
  );
}


/** Tabel harga bertingkat paket (estimasi per tingkat; harga pasti lewat WhatsApp). */
export function PriceTierTable({ tiers, cycle, unit, compact }: { tiers: PriceTier[]; cycle: string; unit?: string; compact?: boolean }) {
  if (!tiers.length) return null;
  return (
    <div className={`overflow-hidden rounded-xl border border-[var(--rule)] ${compact ? "text-xs" : "text-sm"}`}>
      <table className="w-full">
        <tbody className="divide-y divide-[var(--rule)]">
          {tiers.map((t, i) => (
            <tr key={`${t.label}-${i}`} className={i % 2 ? "bg-white/60" : "bg-[#f7f9ff]"}>
              <td className="px-3 py-2 text-[var(--ink-2)]">{t.label}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-[var(--navy)]">{t.price > 0 ? fmtIDR(t.price) : "Hubungi"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--rule)] bg-white/60 px-3 py-1.5 text-[11px] text-[var(--ink-3)]">{cycle}{unit && ` / ${unit}`} · estimasi, harga pasti menyesuaikan kebutuhan</p>
    </div>
  );
}
