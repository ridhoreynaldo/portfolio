import Link from "next/link";
import { LogIn, ShoppingCart, UserRound } from "lucide-react";
import type { AuthUser } from "@/modules/auth/session";

type Menu = { id: string; label: string; path: string };

/** Header HUD halaman portofolio: brand, menu dinamis (path "#section" relatif ke beranda, "/path" absolut), tombol Jasa & Masuk/Portal. */
export function SiteHeader({ brand, menus, user, home = "/" }: { brand: string; menus: Menu[]; user: AuthUser | null; home?: string }) {
  const portal = user ? (user.isSuper || user.permissions.length > 0 ? "/admin" : "/portal") : null;
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(3,6,18,0.72)] backdrop-blur-xl">
      <div className="overflow-hidden border-b border-white/5 bg-black/30">
        <div className="ticker py-1 text-[10px] text-cyan-300/70" style={{ fontFamily: "var(--font-mono)" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex gap-10">
              <span><span className="pulse-dot mr-2 align-middle" />SYSTEM ONLINE</span>
              <span>// BACK-END · MACHINE LEARNING · CLOUD</span>
              <span>// JASA KONSULTASI · PEMBUATAN APLIKASI · SEWA & MAINTENANCE</span>
              <span>// MEDAN · INDONESIA · UTC+7</span>
              <span>// JASA & ORDER → /jasa</span>
            </span>
          ))}
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href={home} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-md shadow-[0_0_16px_rgba(0,240,255,0.5)]" />
          <span className="font-display text-base font-bold tracking-wider text-gradient">{brand}</span>
        </Link>
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

export function SiteFooter({ name }: { name: string }) {
  return (
    <footer className="relative z-10 border-t border-[var(--line)] py-8 text-center text-xs text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
      © {new Date().getFullYear()} {name} // dibangun dengan Next.js · PostgreSQL · Nginx
    </footer>
  );
}
