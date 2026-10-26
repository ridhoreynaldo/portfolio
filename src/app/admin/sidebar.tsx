"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award, Briefcase, CreditCard, Database, FolderKanban, Handshake, KeyRound, LayoutDashboard, ListTree, Package, QrCode, Receipt, Settings,
  ShieldCheck, ShoppingCart, Sparkles, UserCircle, Users, Wallet,
  type LucideIcon,
} from "lucide-react";

/** Ikon yang boleh dipilih di /admin/menus. Tambahkan di sini bila perlu ikon baru. */
export const ADMIN_ICONS = {
  LayoutDashboard, FolderKanban, Briefcase, Award, Sparkles, UserCircle, Settings, Database, ListTree, Users, ShieldCheck, KeyRound,
  Wallet, Package, ShoppingCart, Receipt, Handshake, QrCode, CreditCard,
} satisfies Record<string, LucideIcon>;
export const ADMIN_ICON_NAMES = Object.keys(ADMIN_ICONS) as (keyof typeof ADMIN_ICONS)[];

type Item = { id: string; label: string; icon: string; path: string };
export type SidebarNode = Item & { children: Item[] };

function Icon({ name, className }: { name: string; className?: string }) {
  const C = ADMIN_ICONS[name as keyof typeof ADMIN_ICONS] ?? LayoutDashboard;
  return <C className={className} aria-hidden />;
}

function Entry({ item, nested }: { item: Item; nested?: boolean }) {
  const path = usePathname();
  const active = item.path === "/admin" ? path === "/admin" : path.startsWith(item.path);
  return (
    <Link
      href={item.path}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${nested ? "ml-4" : ""} ${
        active ? "bg-violet-500/20 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.4)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon name={item.icon} className="h-4 w-4 shrink-0 text-violet-300" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ tree }: { tree: SidebarNode[] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
      {tree.map((m) =>
        m.path === "#" ? (
          <div key={m.id} className="mt-2">
            <p className="flex items-center gap-2 px-3 pb-1 text-[11px] uppercase tracking-wider text-slate-500">
              <Icon name={m.icon} className="h-3.5 w-3.5" /> {m.label}
            </p>
            {m.children.map((c) => <Entry key={c.id} item={c} nested />)}
          </div>
        ) : (
          <div key={m.id}>
            <Entry item={m} />
            {m.children.map((c) => <Entry key={c.id} item={c} nested />)}
          </div>
        ),
      )}
    </nav>
  );
}
