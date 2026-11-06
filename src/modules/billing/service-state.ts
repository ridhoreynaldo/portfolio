// Status satu layanan (order) berdasarkan tagihan-tagihannya — dipakai dashboard pelanggan & panel admin.
// Murni (tanpa akses DB), aman diimpor dari mana saja.
import { ORDER_STATUS, billingDayOf, daysUntil, paidUntilDate } from "./labels";
import type { InvoiceRow, OrderRow } from "./repository";

export type Tone = "slate" | "violet" | "cyan" | "emerald" | "rose" | "amber";

export const daysText = (d: number) => (d < 0 ? `lewat ${-d} hari` : d === 0 ? "hari ini" : `${d} hari lagi`);
export const daysTone = (d: number): Tone => (d < 0 ? "rose" : d <= 7 ? "amber" : "emerald");

export function serviceState(o: OrderRow, invoices: InvoiceRow[]) {
  const cycle = o.billingCycle ?? "once";
  const day = billingDayOf(o.startDate);
  /** tagihan milik layanan ini (tanpa yang dibatalkan), urut jatuh tempo */
  const mine = invoices.filter((i) => i.orderId === o.id && i.status !== "cancelled").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const next = mine.find((i) => i.status !== "paid");
  const lastPaid = [...mine].reverse().find((i) => i.status === "paid");
  /** masa aktif yang sudah dibayar */
  const paidUntil = cycle === "monthly" ? (lastPaid?.period ? paidUntilDate(lastPaid.period, day) : null) : cycle === "yearly" ? (o.endDate ?? null) : null;
  const left = next ? daysUntil(next.dueDate) : null;
  /** sisa hari masa aktif (untuk sewa tahunan / kontrak bertanggal akhir) */
  const leftActive = paidUntil ? daysUntil(paidUntil) : o.endDate ? daysUntil(o.endDate) : null;
  let status: { label: string; tone: Tone };
  if (o.status !== "active") status = { label: ORDER_STATUS[o.status].label, tone: ORDER_STATUS[o.status].tone };
  else if (mine.length === 0) status = { label: "Belum ditagih", tone: "slate" };
  else if (next?.status === "pending_verification") status = { label: "Menunggu verifikasi", tone: "cyan" };
  else if (!next || (cycle !== "once" && left != null && left >= 0)) status = { label: "Sudah bayar", tone: "emerald" }; // langganan: belum jatuh tempo = periode berjalan sudah dibayar
  else status = cycle === "once" ? { label: "Belum bayar", tone: "amber" } : { label: "Lewat jatuh tempo", tone: "rose" };
  const canPay = next?.status === "unpaid" && (cycle === "once" || (left ?? 0) <= 7);
  const openTotal = mine.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  return { cycle, mine, next, lastPaid, paidUntil, left, leftActive, status, canPay, openTotal };
}
