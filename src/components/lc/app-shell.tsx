"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Award, Briefcase, CreditCard, Database, FolderKanban, Handshake, Home, KeyRound, LayoutDashboard, ListTree, Menu, Package, QrCode, Receipt,
  Server, Settings, ShieldCheck, ShoppingCart, Sparkles, UserCircle, UserRound, Users, Wallet, X,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/** Ikon yang bisa dipakai menu (admin memilihnya lewat /admin/menus). */
export const SHELL_ICONS = {
  LayoutDashboard, FolderKanban, Briefcase, Award, Sparkles, UserCircle, Settings, Database, ListTree, Users, ShieldCheck, KeyRound,
  Wallet, Package, ShoppingCart, Receipt, Handshake, QrCode, CreditCard, Server, UserRound, Home,
} satisfies Record<string, LucideIcon>;

export type NavItem = { label: string; href: string; icon: string };
export type NavGroup = { label?: string; items: NavItem[] };

function Icon({ name, className }: { name: string; className?: string }) {
  const C = SHELL_ICONS[name as keyof typeof SHELL_ICONS] ?? LayoutDashboard;
  return <C className={className} aria-hidden />;
}

/** Item aktif = href terpanjang yang menjadi awalan path (agar /x tidak ikut aktif di /x/y). */
function activeHref(path: string, hrefs: string[]) {
  return hrefs.filter((h) => path === h || path.startsWith(h.endsWith("/") ? h : `${h}/`)).sort((a, b) => b.length - a.length)[0];
}

type Props = {
  brand: { name: ReactNode; sub: string; href: string; logo: string };
  groups: NavGroup[];
  /** Tab bawah di HP (maks. 4–5). Bila kosong, HP hanya memakai menu laci. */
  tabs?: NavItem[];
  user: { name: string; meta?: ReactNode };
  /** Aksi di kaki sidebar (mis. form keluar). */
  footer?: ReactNode;
  /** Aksi di bilah atas (desktop & HP). */
  topActions?: ReactNode;
  children: ReactNode;
};

/** Kerangka aplikasi: sidebar tetap di desktop, laci + tab bawah di HP. */
export function AppShell({ brand, groups, tabs, user, footer, topActions, children }: Props) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const all = [...groups.flatMap((g) => g.items.map((i) => i.href)), ...(tabs ?? []).map((t) => t.href)];
  const current = activeHref(path, all);

  const Brand = (
    <Link href={brand.href} className="flex min-w-0 items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brand.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[0.95rem]">{brand.name}</span>
        <span className="block truncate text-[11px] text-[var(--ink-3)]">{brand.sub}</span>
      </span>
    </Link>
  );

  const Nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Menu utama">
      {groups.map((g, gi) => (
        <div key={g.label ?? gi} className={gi ? "mt-5" : ""}>
          {g.label && <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{g.label}</p>}
          <ul className="space-y-0.5">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="nav-item" aria-current={i.href === current ? "page" : undefined}>
                  <Icon name={i.icon} className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{i.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const Foot = (
    <div className="border-t border-[var(--line)] p-3">
      <div className="mb-2 flex items-center gap-2.5 px-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--soft)] text-sm font-bold text-[var(--brand-ink)]">{user.name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-[var(--ink)]">{user.name}</p>
          {user.meta && <div className="truncate text-[11px] text-[var(--ink-3)]">{user.meta}</div>}
        </div>
      </div>
      {footer}
    </div>
  );

  return (
    <div className="svc md:grid md:grid-cols-[256px_minmax(0,1fr)]">
      {/* Sidebar desktop */}
      <aside className="shell-side sticky top-0 hidden h-screen flex-col md:flex">
        <div className="flex h-16 items-center px-5">{Brand}</div>
        {Nav}
        {Foot}
      </aside>

      {/* Laci HP */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Tutup menu" onClick={() => setOpen(false)} />
          <aside className="shell-side absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col">
            <div className="flex h-14 items-center justify-between gap-2 px-4">
              {Brand}
              <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => setOpen(false)} aria-label="Tutup menu"><X className="h-4 w-4" /></button>
            </div>
            {Nav}
            {Foot}
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="shell-top sticky top-0 z-40 flex h-14 items-center justify-between gap-2 px-4 md:h-16 md:px-8">
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <button type="button" className="btn-ghost btn-sm btn-icon" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu className="h-4 w-4" /></button>
            {Brand}
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            {topActions}
            <ThemeToggle className="btn-icon" />
          </div>
        </header>
        <main className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8 ${tabs?.length ? "pb-24 md:pb-8" : ""}`}>{children}</main>
      </div>

      {/* Tab bawah HP */}
      {tabs && tabs.length > 0 && (
        <nav className="tabbar fixed inset-x-0 bottom-0 z-40 grid md:hidden" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} aria-label="Navigasi cepat">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} aria-current={t.href === current ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold">
              <Icon name={t.icon} className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
