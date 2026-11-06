import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/lc/wordmark";
import type { AuthUser } from "@/modules/auth/session";
import { fmtIDR } from "@/modules/billing/labels";
import type { PriceTier } from "@/modules/billing/schema";

/** Logo brand (SVG di public/). */
export const SERVICE_LOGO = "/service-logo.svg";

export type ServiceBrand = { name: string; tagline: string; area: string; owner: string };
/** Identitas brand tetap (tidak diambil dari profil pribadi). */
export const SERVICE_BRAND: ServiceBrand = {
  name: "Leetcloud",
  tagline: "Aplikasi, server & WhatsApp gateway untuk bisnis Anda",
  area: "Medan", // domisili pemilik: hanya di invoice & FAQ tatap muka, bukan fokus layanan
  owner: "Edo", // nama panggilan; nama lengkap tidak ditampilkan di Leetcloud
};

const NAV = [
  ["/#paket", "Paket"],
  ["/#proyek", "Proyek"],
  ["/#faq", "FAQ"],
  ["/#kontak", "Kontak"],
] as const;

function Logo({ brand }: { brand: ServiceBrand }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SERVICE_LOGO} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
      <Wordmark className="text-lg" />
    </Link>
  );
}

/** Header halaman publik Leetcloud: logo, menu, tema, login. Di HP menu jadi baris yang bisa digeser. */
export function ServiceHeader({ brand, user }: { brand: ServiceBrand; user: AuthUser | null }) {
  const staff = !!user && (user.isSuper || user.permissions.length > 0);
  const portal = user ? (staff ? "/admin" : "/dashboard") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6" aria-label="Menu utama">
        <Logo brand={brand} />
        <ul className="hidden items-center gap-1 text-sm font-medium text-[var(--ink-2)] md:flex">
          {NAV.map(([href, label]) => <li key={href}><a href={href} className="rounded-lg px-3 py-2 transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">{label}</a></li>)}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle className="btn-icon" />
          {portal ? (
            <Link href={portal} className="btn-primary btn-sm"><UserRound className="h-3.5 w-3.5" /> Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-primary btn-sm"><LogIn className="h-3.5 w-3.5" /> Login</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function ServiceFooter({ brand }: { brand: ServiceBrand; wa?: string | null }) {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-[var(--ink-3)] sm:flex-row">
        <p>© {new Date().getFullYear()} <Wordmark /></p>
        <p className="flex gap-4"><Link href="/login" className="hover:text-[var(--brand-ink)]">Login</Link><Link href="/register" className="hover:text-[var(--brand-ink)]">Daftar</Link></p>
      </div>
    </footer>
  );
}

/** Blok identitas brand untuk halaman kecil (login/daftar). */
export function ServiceBrandMark({ brand, title, sub }: { brand: ServiceBrand; title: string; sub: string }) {
  return (
    <div className="mb-6 text-center">
      <Link href="/" className="inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_LOGO} alt="" className="mx-auto h-12 w-12 rounded-xl" />
      </Link>
      <p className="mt-2"><Wordmark className="text-lg" /></p>
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
