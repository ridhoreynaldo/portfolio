"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";

export default function Topbar({ session }: { session: SessionPayload }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between border-x-0 border-t-0 px-5 py-3.5 lg:px-8">
      <div className="pl-12 lg:pl-0">
        <p className="text-xs uppercase tracking-widest text-slate-500">Dashboard</p>
        <h1 className="font-display text-lg font-bold text-white">
          Selamat datang, <span className="text-gradient">{session.name}</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-sm text-slate-300 sm:flex">
          <span className="rounded-lg bg-white/5 p-2">
            <UserRound className="h-4 w-4 text-cyan-300" />
          </span>
          <div className="leading-tight">
            <div className="font-medium text-white">{session.name}</div>
            <div className="text-xs text-slate-500">
              {session.roles.join(", ")}
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-ghost !px-4 !py-2 text-sm"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
