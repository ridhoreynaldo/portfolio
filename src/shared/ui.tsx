import type { ReactNode } from "react";

// Kelas utilitas tema ada di globals.css (.glass, .btn-primary, .btn-ghost, .btn-danger, .input-dark, .label)
export const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400";
export const td = "px-3 py-2 text-sm border-t border-white/5";

export function Card({ title, children, right, className = "" }: { title?: ReactNode; children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <section className={`glass mb-6 rounded-2xl ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
          <h2 className="font-display text-sm font-semibold text-white">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-white">{children}</h1>
      {sub && <p className="mt-1 text-sm text-slate-400">{sub}</p>}
    </div>
  );
}

export function Flash({ flash }: { flash: { type: "error" | "ok"; message: string } | null }) {
  if (!flash) return null;
  const tone = flash.type === "error" ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200";
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${tone}`}>{flash.message}</div>;
}

export const Badge = ({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "violet" | "cyan" | "emerald" | "rose" | "amber" }) => {
  const tones = {
    slate: "bg-white/10 text-slate-300",
    violet: "bg-violet-500/20 text-violet-200",
    cyan: "bg-cyan-500/20 text-cyan-200",
    emerald: "bg-emerald-500/20 text-emerald-200",
    rose: "bg-rose-500/20 text-rose-200",
    amber: "bg-amber-500/20 text-amber-200",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
};

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full">{children}</table>
  </div>
);

/** Tanggal `YYYY-MM-DD` (kolom date) → "5 Jan 2024"; null → "—". */
export function fmtDate(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00Z");
  return Number.isNaN(dt.getTime()) ? d : new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: "UTC" }).format(dt);
}

export const fmtDateTime = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: process.env.TZ_APP ?? "Asia/Jakarta" }).format(d) : "—";
