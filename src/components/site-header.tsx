import Link from "next/link";
import { LogIn, ShoppingCart, UserRound } from "lucide-react";
import type { AuthUser } from "@/modules/auth/session";

type Menu = { id: string; label: string; path: string };

/** Logo brand jasa (SVG di public/). Dipakai di halaman /jasa, form order, login/daftar, dan portal. */
export const SERVICE_LOGO = "/service-logo.svg";
/** Nama brand jasa cadangan bila kolom profil masih kosong. */
export const SERVICE_BRAND_FALLBACK = "NEXORBIT";

/**
 * Header HUD halaman publik: brand, menu dinamis (path "#section" relatif ke beranda, "/path" absolut), tombol Jasa & Masuk/Portal.
 * `logo` mengganti logo pribadi; `by` menampilkan "oleh <nama>" kecil di bawah brand (dipakai halaman jasa yang brand-nya terpisah dari nama pemilik).
 */
export function SiteHeader({ brand, menus, user, home = "/", logo = "/logo.png", by, ticker }: {
  brand: string; menus: Menu[]; user: AuthUser | null; home?: string; logo?: string; by?: { name: string; href: string }; ticker?: string;
}) {
  const portal = user ? (user.isSuper || user.permissions.length > 0 ? "/admin" : "/portal") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(3,6,18,0.72)] backdrop-blur-xl">
      <div className="overflow-hidden border-b border-white/5 bg-black/30">
        <div className="ticker py-1 text-[10px] text-cyan-300/70" style={{ fontFamily: "var(--font-mono)" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              <span><span className="pulse-dot mr-2 align-middle" />SYSTEM ONLINE</span>
              <span>// {ticker ?? "BACK-END · MACHINE LEARNING · CLOUD"}</span>
              <span>// JASA KONSULTASI · PEMBUATAN APLIKASI · SEWA & MAINTENANCE</span>
              <span>// MEDAN · INDONESIA · UTC+7</span>
              <span>// JASA & ORDER → /jasa</span>
            </span>
          ))}
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Link href={home} className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" className="h-8 w-8 rounded-md shadow-[0_0_16px_rgba(0,240,255,0.5)]" />
            <span className="font-display text-base font-bold tracking-wider text-gradient">{brand}</span>
          </Link>
          {by && (
            <Link href={by.href} className="hidden border-l border-white/10 pl-2.5 text-[10px] leading-tight text-slate-500 transition hover:text-cyan-300 sm:block" style={{ fontFamily: "var(--font-mono)" }}>
              oleh<br /><span className="text-slate-300">{by.name}</span>
            </Link>
          )}
        </div>
        <ul className="hidden items-center gap-5 text-[13px] text-slate-300 lg:flex" style={{ fontFamily: "var(--font-mono)" }}>
          {menus.map((m) => (
            <li key={m.id}>
              <a href={m.path.startsWith("/") || home === "/" ? m.path : `/${m.path}`} className="transition hover:text-cyan-300">{m.label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/jasa" className="btn-primary btn-sm"><ShoppingCart className="h-3.5 w-3.5" /> Jasa</Link>
          {portal ? (
            <Link href={portal} className="btn-ghost btn-sm"><UserRound className="h-3.5 w-3.5" /> {user!.name.split(" ")[0]}</Link>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm"><LogIn className="h-3.5 w-3.5" /> Masuk</Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ name, by }: { name: string; by?: string }) {
  return (
    <footer className="relative z-10 border-t border-[var(--line)] py-8 text-center text-xs text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
      © {new Date().getFullYear()} {name}{by && <> · oleh <Link href="/" className="text-slate-400 hover:text-cyan-300">{by}</Link></>} // dibangun dengan Next.js · PostgreSQL · Nginx
    </footer>
  );
}

/** Blok identitas brand jasa untuk halaman tanpa header (login/daftar). */
export function ServiceBrandMark({ brand, by, sub }: { brand: string; by: string; sub: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Link href="/jasa">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SERVICE_LOGO} alt="" className="h-10 w-10 rounded-md shadow-[0_0_16px_rgba(0,240,255,0.5)]" />
      </Link>
      <div className="min-w-0">
        <p className="hud-label">// {sub}</p>
        <h1 className="font-display text-lg font-bold tracking-wider text-gradient">{brand}</h1>
        <p className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>oleh <Link href="/" className="text-slate-400 hover:text-cyan-300">{by}</Link></p>
      </div>
    </div>
  );
}
