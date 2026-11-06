import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
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
  ["/medan#layanan", "Layanan"],
  ["/medan#paket", "Paket"],
  ["/medan#proyek", "Proyek"],
  ["/medan#faq", "FAQ"],
  ["/medan#kontak", "Kontak"],
] as const;

function Logo({ brand, sub }: { brand: ServiceBrand; sub: string }) {
  return (
    <Link href="/medan" className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SERVICE_LOGO} alt="" className="h-9 w-9 shrink-0 rounded-lg" />
      <span className="min-w-0 leading-tight">
        <span className="block text-lg font-bold text-[var(--ink)]">{brand.name}</span>
        <span className="block truncate text-[11px] text-[var(--ink-3)]">{sub}</span>
      </span>
    </Link>
  );
}

/** Header halaman publik Leetcloud: logo, menu, tema, login. Di HP menu jadi baris yang bisa digeser. */
export function ServiceHeader({ brand, user }: { brand: ServiceBrand; user: AuthUser | null }) {
  const staff = !!user && (user.isSuper || user.permissions.length > 0);
  const portal = user ? (staff ? "/admin" : "/medan/dashboard") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6" aria-label="Menu utama">
        <Logo brand={brand} sub={`Layanan IT · ${brand.area}`} />
        <ul className="hidden items-center gap-1 text-sm font-medium text-[var(--ink-2)] md:flex">
          {NAV.map(([href, label]) => <li key={href}><a href={href} className="rounded-lg px-3 py-2 transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">{label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle className="btn-icon" />
          {portal ? (
            <Link href={portal} className="btn-primary btn-sm"><UserRound className="h-3.5 w-3.5" /> Dashboard</Link>
          ) : (
            <Link href="/medan/login" className="btn-primary btn-sm"><LogIn className="h-3.5 w-3.5" /> Login</Link>
          )}
        </div>
      </nav>
      <ul className="no-scrollbar flex gap-1 overflow-x-auto border-t border-[var(--line)] px-3 py-1.5 text-sm font-medium text-[var(--ink-2)] md:hidden">
        {NAV.map(([href, label]) => <li key={href} className="shrink-0"><a href={href} className="block rounded-lg px-3 py-1.5 active:bg-[var(--surface-2)]">{label}</a></li>)}
      </ul>
    </header>
  );
}

export function ServiceFooter({ brand, wa }: { brand: ServiceBrand; wa?: string | null }) {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr] md:px-6">
        <div>
          <Logo brand={brand} sub={`Layanan IT · ${brand.area}`} />
          <p className="mt-3 max-w-sm text-sm text-[var(--ink-3)]">{brand.tagline}.</p>
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--ink)]">Menu</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-2)]">
            {NAV.map(([href, label]) => <li key={href}><a href={href} className="hover:text-[var(--brand-ink)]">{label}</a></li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--ink)]">Pelanggan</p>
          <ul className="mt-3 space-y-2 text-sm text-[var(--ink-2)]">
            <li><Link href="/medan/login" className="hover:text-[var(--brand-ink)]">Login dashboard</Link></li>
            <li><Link href="/medan/register" className="hover:text-[var(--brand-ink)]">Daftar akun</Link></li>
            {wa && <li><a href={wa} target="_blank" rel="noreferrer" className="hover:text-[var(--brand-ink)]">WhatsApp</a></li>}
          </ul>
        </div>
      </div>
      <p className="border-t border-[var(--line)] px-4 py-4 text-center text-xs text-[var(--ink-3)]">© {new Date().getFullYear()} {brand.name} · {brand.area}, Indonesia</p>
    </footer>
  );
}

/** Blok identitas brand untuk halaman kecil (login/daftar). */
export function ServiceBrandMark({ brand, title, sub }: { brand: ServiceBrand; title: string; sub: string }) {
  return (
    <div className="mb-6 text-center">
      <Link href="/medan" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_LOGO} alt="" className="mx-auto h-12 w-12 rounded-xl" />
      </Link>
      <p className="mt-2 text-sm font-bold text-[var(--ink)]">{brand.name}</p>
      <h1 className="mt-5 text-2xl font-bold text-[var(--ink)]">{title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-3)]">{sub}</p>
    </div>
  );
}

/** Tabel harga bertingkat paket (estimasi per tingkat; harga pasti lewat WhatsApp). */
export function PriceTierTable({ tiers, cycle, unit, compact }: { tiers: PriceTier[]; cycle: string; unit?: string; compact?: boolean }) {
  if (!tiers.length) return null;
  return (
    <div className={`overflow-hidden rounded-lg border border-[var(--line)] ${compact ? "text-xs" : "text-sm"}`}>
      <table className="w-full">
        <tbody className="divide-y divide-[var(--line)]">
          {tiers.map((t, i) => (
            <tr key={`${t.label}-${i}`} className={i % 2 ? "bg-[var(--surface)]" : "bg-[var(--surface-2)]"}>
              <td className="px-3 py-2 text-[var(--ink-2)]">{t.label}</td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-[var(--ink)]">{t.price > 0 ? fmtIDR(t.price) : "Hubungi"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--ink-3)]">{cycle}{unit && ` / ${unit}`} · estimasi, harga pasti menyesuaikan kebutuhan</p>
    </div>
  );
}
