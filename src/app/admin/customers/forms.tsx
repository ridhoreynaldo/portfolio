import { MoneyInput } from "@/components/lc/money-input";
import { Modal } from "@/components/lc/modal";
import { createOrderAction, saveInvoiceAction, updateOrderAction } from "@/modules/billing/actions";
import { CYCLE, ORDER_STATUS, currentPeriod, fmtIDR } from "@/modules/billing/labels";
import { invoiceLinesFor, orderTotal, type InvoiceRow, type OrderRow, type PackageRow } from "@/modules/billing/repository";
import { orderStatus } from "@/modules/billing/schema";
import { serviceState } from "@/modules/billing/service-state";

const idr = (n: number) => new Intl.NumberFormat("id-ID").format(n);
const lines = (rows: { description: string; amount: number; note?: string }[]) => rows.map((b) => `${b.description} | ${idr(b.amount)}${b.note ? ` | ${b.note}` : ""}`).join("\n");

/** Field langganan yang sama untuk tambah & edit layanan. */
export function SubscriptionFields({ o }: { o?: OrderRow }) {
  return (
    <>
      <div><label className="label">Status</label><select name="status" defaultValue={o?.status ?? "active"} className="input-dark">{orderStatus.enumValues.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}</select></div>
      <div>
        <label className="label">Siklus tagihan</label>
        <select name="billingCycle" defaultValue={o?.cycleOverride ?? ""} className="input-dark">
          <option value="">Ikut paket{o && o.cycleOverride == null && o.price != null ? ` (${CYCLE[o.billingCycle ?? "once"]})` : ""}</option>
          <option value="monthly">Bulanan (tagihan dibuat otomatis tiap bulan)</option>
          <option value="yearly">Tahunan</option>
          <option value="once">Sekali bayar</option>
        </select>
        <p className="mt-1 text-xs text-[var(--ink-3)]">Bulanan: tagihan terbit otomatis 3 hari sebelum jatuh tempo (tanggal = tanggal mulai layanan) sampai tanggal berakhir.</p>
      </div>
      <div><label className="label">Mulai layanan</label><input name="startDate" type="date" defaultValue={o?.startDate ?? ""} className="input-dark" /></div>
      <div><label className="label">Berakhir / lunas s.d.</label><input name="endDate" type="date" defaultValue={o?.endDate ?? ""} className="input-dark" /><p className="mt-1 text-xs text-[var(--ink-3)]">Sewa tahunan: tanggal jatuh tempo perpanjangan. Bulanan: kosongkan bila terus berjalan.</p></div>
      <div><label className="label">Harga kesepakatan / unit (Rp)</label><MoneyInput name="unitPrice" defaultValue={o?.unitPrice} placeholder={o?.price ? `kosong = harga paket ${fmtIDR(o.price)}` : "kosong = harga paket"} /></div>
      <div><label className="label">Sebutan item</label><input name="itemLabel" maxLength={32} defaultValue={o?.itemLabel ?? ""} placeholder="subdomain / domain / nomor" className="input-dark" /></div>
      <div><label className="label">Limit item</label><input name="itemLimit" type="number" min={0} max={100000} defaultValue={o?.itemLimit ?? ""} placeholder="kosong = tanpa batas" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Rincian biaya per siklus (opsional, satu per baris: <code>deskripsi | nominal</code>) — jadi baris tagihan & menimpa total</label><textarea name="breakdown" rows={3} defaultValue={lines(o?.breakdown ?? [])} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2.000.000\nMaintenance Aplikasi | 2.500.000"} /></div>
      <div className="sm:col-span-3"><label className="label">Daftar item (satu per baris, mis. subdomain yang di-host)</label><textarea name="items" rows={3} defaultValue={(o?.items ?? []).join("\n")} className="input-dark font-mono text-xs" placeholder={"app.contoh.com\napi.contoh.com"} /></div>
      <div className="sm:col-span-3"><label className="label">Ditagihkan kepada (tujuan invoice; kosong = nama akun)</label><input name="billTo" maxLength={160} defaultValue={o?.billTo ?? ""} placeholder="mis. Adzkia Smart / Bimbel Adzkia Kedinasan" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Email tujuan tagihan (kosong = email akun)</label><input name="billToEmail" type="email" maxLength={160} defaultValue={o?.billToEmail ?? ""} placeholder="mis. keuangan@klien.com" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Catatan untuk pelanggan (tampil di portal)</label><textarea name="adminNote" rows={2} maxLength={2000} defaultValue={o?.adminNote ?? ""} className="input-dark" /></div>
    </>
  );
}

/** Tambah / edit layanan milik satu pelanggan. */
export function OrderFormModal({ o, customerId, customerName, packages, back }: { o?: OrderRow; customerId: string; customerName: string; packages: PackageRow[]; back: string }) {
  return (
    <Modal title={o ? `Edit layanan ${o.number} — ${customerName}` : `Tambah layanan — ${customerName}`} close={back} wide>
      <form action={o ? updateOrderAction : createOrderAction} className="space-y-4" key={o?.id ?? "new"}>
        <input type="hidden" name="back" value={back} />
        {o ? <input type="hidden" name="id" value={o.id} /> : <input type="hidden" name="userId" value={customerId} />}
        <div className="grid gap-4 sm:grid-cols-3">
          {o ? (
            <div className="sm:col-span-3 text-sm"><span className="label">Layanan</span>{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`} · {orderTotal(o) > 0 ? `${fmtIDR(orderTotal(o))} ${CYCLE[o.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}</div>
          ) : (
            <>
              <div className="sm:col-span-2">
                <label className="label">Nama layanan / paket *</label>
                <input name="packageName" required minLength={2} maxLength={128} list="pkg-list" autoComplete="off" placeholder="ketik bebas, mis. Sewa Server + Maintenance" className="input-dark" />
                <datalist id="pkg-list">{packages.map((p) => <option key={p.id} value={p.name}>{p.price > 0 ? `${fmtIDR(p.price)} ${CYCLE[p.billingCycle]}` : "harga kesepakatan"}</option>)}</datalist>
                <p className="mt-1 text-xs text-[var(--ink-3)]">Boleh diketik sendiri. Bila sama dengan nama paket, harganya ikut paket; isi “Harga kesepakatan” untuk harga sendiri.</p>
              </div>
              <div><label className="label">Jumlah</label><input name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark" /></div>
            </>
          )}
          <SubscriptionFields o={o} />
        </div>
        <button className="btn-primary">{o ? "Simpan layanan" : "Buat layanan"}</button>
      </form>
    </Modal>
  );
}

/** Tambah / edit tagihan milik satu pelanggan. `orderId` (tambah) = isi otomatis dari layanan itu. */
export function InvoiceFormModal({ inv, customerId, customerName, orders, invoices, presetOrderId, internalNote, back }: {
  inv?: InvoiceRow; customerId: string; customerName: string; orders: OrderRow[]; invoices: InvoiceRow[]; presetOrderId?: string; internalNote: string; back: string;
}) {
  const po = !inv && presetOrderId ? orders.find((o) => o.id === presetOrderId) : undefined;
  const st = po ? serviceState(po, invoices) : undefined;
  const week = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const v = {
    orderId: inv?.orderId ?? po?.id ?? "",
    title: inv?.title ?? (po ? `${po.packageName}${po.quantity > 1 ? ` ×${po.quantity}` : ""} — ${po.number}` : ""),
    billTo: inv?.billTo ?? po?.billTo ?? "",
    billToEmail: inv?.billToEmail ?? po?.billToEmail ?? "",
    amount: inv?.amount ?? (po ? orderTotal(po) : ""),
    period: inv?.period ?? (po?.billingCycle === "monthly" ? currentPeriod() : ""),
    dueDate: inv?.dueDate ?? st?.paidUntil ?? week,
    note: inv?.note ?? "",
    items: inv ? lines(inv.items) : po ? lines(invoiceLinesFor(po)) : "",
    paidAt: inv?.paidAt ? new Date(inv.paidAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : "",
  };
  return (
    <Modal title={inv ? `Edit tagihan ${inv.number}` : `Tagihan baru — ${customerName}`} close={back} wide>
      <form action={saveInvoiceAction} className="space-y-4" key={inv?.id ?? `new-${presetOrderId ?? ""}`}>
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="userId" value={customerId} />
        {inv && <input type="hidden" name="id" value={inv.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Layanan terkait (opsional)</label>
            <select name="orderId" defaultValue={v.orderId} className="input-dark">
              <option value="">{orders.length ? "— tagihan manual —" : "pelanggan ini belum punya layanan"}</option>
              {orders.filter((o) => o.status !== "cancelled" || o.id === v.orderId).map((o) => <option key={o.id} value={o.id}>{o.number} · {o.packageName}</option>)}
            </select>
          </div>
          <div><label className="label">Periode (kosong = sekali)</label><input name="period" type="month" defaultValue={v.period} className="input-dark" /></div>
          <div className="sm:col-span-2"><label className="label">Judul tagihan *</label><input name="title" required minLength={2} maxLength={255} defaultValue={v.title} placeholder="Sewa Server — Desember 2026" className="input-dark" /></div>
          <div className="sm:col-span-2"><label className="label">Rincian baris (opsional, satu per baris: <code>deskripsi | nominal | keterangan</code>; nominal tagihan otomatis = jumlahnya)</label><textarea name="items" rows={3} defaultValue={v.items} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2.000.000\nMaintenance Aplikasi | 2.500.000"} /></div>
          <div><label className="label">Nominal (Rp) <span className="text-[var(--ink-3)]">(diabaikan bila ada rincian)</span></label><MoneyInput name="amount" defaultValue={v.amount} /></div>
          <div><label className="label">Jatuh tempo *</label><input name="dueDate" type="date" required defaultValue={v.dueDate} className="input-dark" /></div>
          <div><label className="label">Tanggal dibayar (isi = tandai lunas)</label><input name="paidAt" type="date" defaultValue={v.paidAt} className="input-dark" /></div>
          <div><label className="label">Ditagihkan kepada (kosong = ikut layanan / akun)</label><input name="billTo" maxLength={160} defaultValue={v.billTo} className="input-dark" /></div>
          <div className="sm:col-span-2"><label className="label">Email tujuan tagihan (kosong = ikut layanan / akun)</label><input name="billToEmail" type="email" maxLength={160} defaultValue={v.billToEmail} className="input-dark" /></div>
          <div className="sm:col-span-2"><label className="label">Catatan (tampil ke pelanggan)</label><input name="note" maxLength={2000} defaultValue={v.note} className="input-dark" /></div>
          <div className="sm:col-span-2"><label className="label">🔒 Catatan internal (hanya admin, tidak tampil ke pelanggan)</label><textarea name="internalNote" rows={3} maxLength={4000} defaultValue={internalNote} placeholder="mis. Rp 2.000.000 uang server · Rp 220.000 pajak server · Rp 4.000 pajak QRIS" className="input-dark" /></div>
        </div>
        <button className="btn-primary">{inv ? "Simpan perubahan" : "Buat tagihan"}</button>
      </form>
    </Modal>
  );
}
