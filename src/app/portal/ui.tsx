import type { ReactNode } from "react";

// Primitif kecil portal pelanggan bertema Kodeva (klasik terang). Kelas .pill-* / .tbl ada di globals.css (blok .svc).

export type Tone = "slate" | "violet" | "cyan" | "emerald" | "rose" | "amber";

export const Pill = ({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) => <span className={`pill pill-${tone}`}>{children}</span>;

export const pth = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]";
export const ptd = "px-3 py-2.5 text-sm border-t border-[var(--rule)] align-top";

export function PortalTitle({ eyebrow, title, right }: { eyebrow: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-serif mt-2 text-3xl font-semibold text-[var(--navy)]">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</p>
      <p className="font-serif mt-1 text-2xl font-semibold text-[var(--navy)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--ink-3)]">{sub}</p>}
    </div>
  );
}
