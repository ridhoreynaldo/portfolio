import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Primitif UI Leetcloud (dipakai dashboard pelanggan & panel admin, di dalam .svc).
 * Semua warna lewat token CSS (--surface, --ink, --brand, ...) sehingga otomatis ikut tema terang/gelap.
 */

export { fmtDate, fmtDateTime } from "@/shared/ui";

export type Tone = "slate" | "violet" | "cyan" | "emerald" | "rose" | "amber";

export const Pill = ({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) => <span className={`pill pill-${tone}`}>{children}</span>;
/** Alias lama dari shared/ui. */
export const Badge = Pill;

/** Judul halaman: eyebrow kecil, judul, keterangan, dan tombol aksi di kanan (turun ke bawah di HP). */
export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="cosmic-text mt-1 text-2xl font-bold md:text-[1.75rem]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-[var(--ink-3)]">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Kompatibel dengan PageTitle lama (children = judul). */
export const PageTitle = ({ children, sub, actions }: { children: ReactNode; sub?: string; actions?: ReactNode }) => <PageHeader title={children} sub={sub} actions={actions} />;

export function Card({ title, right, children, className = "", flush }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={`card mb-6 overflow-hidden ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 md:px-5">
          <h2 className="text-[0.95rem] font-semibold text-[var(--ink)]">{title}</h2>
          {right}
        </header>
      )}
      <div className={flush ? "" : "p-4 md:p-5"}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, href, icon }: { label: ReactNode; value: ReactNode; sub?: ReactNode; href?: string; icon?: ReactNode }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--ink-3)]">{label}</p>
        {icon && <span className="icon-box !h-8 !w-8">{icon}</span>}
      </div>
      {/* ukuran font menyesuaikan lebar kotak & panjang teks (lihat .stat-value di globals.css) */}
      <p className="stat-value mt-2 font-bold text-[var(--ink)]" style={{ "--len": typeof value === "string" || typeof value === "number" ? String(value).length : 8 } as React.CSSProperties} title={typeof value === "string" ? value : undefined}>{value}</p>
      {sub && <p className="mt-1 text-xs text-[var(--ink-3)]">{sub}</p>}
    </>
  );
  return href ? <a href={href} className="stat-box card card-link block p-4 md:p-5">{body}</a> : <div className="stat-box card p-4 md:p-5">{body}</div>;
}

/** Tabel: wadah gulir horizontal + gaya .tbl. Kelas th/td dibiarkan untuk kompatibilitas. */
export const Table = ({ children, minWidth }: { children: ReactNode; minWidth?: number }) => (
  <div className="overflow-x-auto">
    <table className="tbl" style={minWidth ? { minWidth } : undefined}>{children}</table>
  </div>
);
export const th = "";
export const td = "";

export function Flash({ flash }: { flash: { type: "error" | "ok"; message: string } | null }) {
  if (!flash) return null;
  return <div role="status" className={`mb-4 px-4 py-3 text-sm ${flash.type === "error" ? "alert-error" : "alert-ok"}`}>{flash.message}</div>;
}

export function EmptyState({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <p className="font-semibold text-[var(--ink)]">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-[var(--ink-3)]">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Daftar ringkas bernomor: tiap baris bisa diklik untuk membuka detail (modal). */
export function List({ children, count, label }: { children: ReactNode; count?: number; label?: string }) {
  return (
    <section className="card overflow-hidden">
      {count != null && <p className="border-b border-[var(--line)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">{count} {label ?? "data"}</p>}
      <ol className="list">{children}</ol>
    </section>
  );
}

export function RowLink({ no, href, children, right, dim }: { no: number; href: string; children: ReactNode; right?: ReactNode; dim?: boolean }) {
  return (
    <li>
      <Link href={href} scroll={false} className={`list-row ${dim ? "opacity-55" : ""}`}>
        <span className="row-no num">{no}</span>
        <span className="min-w-0">{children}</span>
        <span className="flex items-center gap-3">{right}<ChevronRight className="h-4 w-4 shrink-0 text-[var(--ink-3)]" aria-hidden /></span>
      </Link>
    </li>
  );
}

/** Pasangan label–nilai untuk modal detail. */
export function Info({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">{label}</dt>
      <dd className="mt-0.5 text-sm text-[var(--ink)]">{children}</dd>
    </div>
  );
}
