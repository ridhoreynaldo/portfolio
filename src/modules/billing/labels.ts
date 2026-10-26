// Label & warna status — aman diimpor dari client component (tanpa server-only).
import type { BillingCycle, InvoiceStatus, OrderStatus } from "./schema";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: "amber" | "emerald" | "cyan" | "rose" | "slate" }> = {
  pending: { label: "Menunggu konfirmasi", tone: "amber" },
  active: { label: "Aktif", tone: "emerald" },
  completed: { label: "Selesai", tone: "cyan" },
  cancelled: { label: "Dibatalkan", tone: "rose" },
};

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: "amber" | "emerald" | "cyan" | "rose" | "slate" }> = {
  unpaid: { label: "Belum dibayar", tone: "amber" },
  pending_verification: { label: "Menunggu verifikasi", tone: "cyan" },
  paid: { label: "Lunas", tone: "emerald" },
  cancelled: { label: "Dibatalkan", tone: "slate" },
};

export const CYCLE: Record<BillingCycle, string> = { once: "sekali bayar", monthly: "per bulan", yearly: "per tahun" };

export const PACKAGE_CATEGORIES = ["Konsultasi", "Pembuatan Aplikasi", "Sewa", "Maintenance", "Mentoring", "Lainnya"] as const;

export const fmtIDR = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

/** "2026-10" → "Oktober 2026". */
export function fmtPeriod(p: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if (!m) return p || "—";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(+m[1]!, +m[2]! - 1, 1)));
}

export const currentPeriod = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const isOverdue = (dueDate: string, status: InvoiceStatus) => status === "unpaid" && dueDate < new Date().toISOString().slice(0, 10);
