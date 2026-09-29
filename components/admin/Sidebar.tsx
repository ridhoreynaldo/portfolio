"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { ICONS } from "./icons";
import type { MenuNode } from "@/lib/menu-types";

function MenuItem({ node, depth }: { node: MenuNode; depth: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const Icon = ICONS[node.icon] ?? LayoutDashboard;
  const hasChildren = node.children.length > 0;
  const active = node.path !== "#" && pathname === node.path;

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition ${
          active
            ? "bg-gradient-to-r from-violet-600/40 to-cyan-500/20 text-white shadow"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
        style={{ paddingLeft: `${0.75 + depth * 1.1}rem` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setOpen(!open)}
            className="rounded p-0.5 hover:bg-white/10"
            aria-label="Buka/tutup submenu"
          >
            {open ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-violet-300" />
        {node.path === "#" ? (
          <span className="flex-1 font-medium">{node.label}</span>
        ) : (
          <Link href={node.path} className="flex-1 font-medium">
            {node.label}
          </Link>
        )}
      </div>
      {hasChildren && open && (
        <div className="mt-0.5 space-y-0.5">
          {node.children.map((c) => (
            <MenuItem key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ tree }: { tree: MenuNode[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const panel = (
    <aside className="glass flex h-full w-64 flex-col rounded-none border-y-0 border-l-0 p-4">
      <Link href="/admin" className="mb-6 px-2">
        <span className="font-display text-gradient text-xl font-extrabold">
          Mission Control
        </span>
      </Link>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {tree.map((n) => (
          <MenuItem key={n.id} node={n} depth={0} />
        ))}
      </nav>
      <Link
        href="/"
        target="_blank"
        className="mt-4 rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        Lihat Situs Publik
      </Link>
    </aside>
  );

  return (
    <>
      <button
        className="fixed left-4 top-4 z-50 rounded-xl border border-white/10 bg-[#0d0d1f]/90 p-2.5 text-white backdrop-blur lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
      </button>
      <div className="hidden h-screen shrink-0 lg:block">{panel}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0" onClick={() => setMobileOpen(false)}>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
