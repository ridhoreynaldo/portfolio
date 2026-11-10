import "server-only";
import { billingDayOf } from "./labels";
import { insertInvoice, invoiceLinesFor, isUniqueViolation, listInvoices, listOrders, nextNumber, orderTotal } from "./repository";

const WIB = "Asia/Jakarta";
/** Tanggal "hari ini" menurut WIB, format YYYY-MM-DD. */
const todayWib = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: WIB }).format(d);
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * Terbitkan tagihan bulanan otomatis. Untuk tiap layanan AKTIF bersiklus bulanan:
 *  - jatuh tempo periode = tanggal mulai layanan di bulan itu (maks tgl 28; tanpa tanggal mulai = tgl 15)
 *  - tagihan terbit saat jatuh tempo tinggal <= `leadDays` hari (dan belum lewat: tunggakan lama tidak dibuat otomatis)
 *  - tidak melewati tanggal berakhir layanan, dan tidak ganda bila periode itu sudah punya tagihan (selain yang dibatalkan)
 * Aman dipanggil berulang (idempoten).
 */
export async function generateUpcomingInvoices(leadDays = 3) {
  const today = todayWib();
  const horizon = addDays(today, leadDays);
  const [orders, invoices] = await Promise.all([listOrders({ status: "active" }), listInvoices()]);
  const created: string[] = [];
  for (const o of orders) {
    if (o.billingCycle !== "monthly") continue;
    const price = orderTotal(o);
    if (price <= 0) continue;
    const mine = invoices.filter((i) => i.orderId === o.id && i.status !== "cancelled");
    for (const ym of new Set([today.slice(0, 7), horizon.slice(0, 7)])) {
      const due = `${ym}-${String(billingDayOf(o.startDate)).padStart(2, "0")}`;
      if (due < today || due > horizon) continue;
      if (o.startDate && due < o.startDate) continue;
      if (o.endDate && due > o.endDate) continue;
      if (mine.some((i) => i.period === ym || i.dueDate.startsWith(ym))) continue;
      for (let t = 0; t < 3; t++) {
        const number = await nextNumber("INV");
        try {
          await insertInvoice({
            number, userId: o.userId, orderId: o.id, billTo: o.billTo, billToEmail: o.billToEmail, period: ym, dueDate: due,
            title: `${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""} — ${o.number}`, amount: price, items: invoiceLinesFor(o), note: "Tagihan bulanan otomatis",
          });
          created.push(`${number} (${o.number} ${ym})`);
          break;
        } catch (e) {
          if (t === 2 || !isUniqueViolation(e, "invoices_number_unique")) throw e;
        }
      }
    }
  }
  return created;
}
