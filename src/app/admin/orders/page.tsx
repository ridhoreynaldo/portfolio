import Link from "next/link";
import { Badge, Card, PageTitle, Table, fmtDateTime, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { createOrderAction, deleteOrderAction, updateOrderAction } from "@/modules/billing/actions";
import { CYCLE, ORDER_STATUS, currentPeriod, fmtIDR } from "@/modules/billing/labels";
import { listCustomers, listOrders, listPackages, orderTotal, orderUnitPrice, type OrderRow } from "@/modules/billing/repository";
import { orderStatus } from "@/modules/billing/schema";

/** Field langganan yang sama untuk form proses & order manual. */
function SubscriptionFields({ o }: { o?: OrderRow }) {
  return (
    <>
      <div><label className="label">Status</label><select name="status" defaultValue={o?.status ?? "active"} className="input-dark">{orderStatus.enumValues.map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}</select></div>
      <div><label className="label">Mulai layanan</label><input name="startDate" type="date" defaultValue={o?.startDate ?? ""} className="input-dark" /></div>
      <div><label className="label">Berakhir / lunas s.d.</label><input name="endDate" type="date" defaultValue={o?.endDate ?? ""} className="input-dark" /><p className="mt-1 text-xs text-slate-500">Untuk sewa tahunan/kontrak; portal menampilkan sisa waktu.</p></div>
      <div><label className="label">Harga kesepakatan / unit (Rp)</label><input name="unitPrice" type="number" min={0} step={1000} defaultValue={o?.unitPrice ?? ""} placeholder={o?.price ? `kosong = harga paket ${fmtIDR(o.price)}` : "kosong = harga paket"} className="input-dark" /></div>
      <div><label className="label">Sebutan item</label><input name="itemLabel" maxLength={32} defaultValue={o?.itemLabel ?? ""} placeholder="subdomain / domain / nomor" className="input-dark" /></div>
      <div><label className="label">Limit item</label><input name="itemLimit" type="number" min={0} max={100000} defaultValue={o?.itemLimit ?? ""} placeholder="kosong = tanpa batas" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Rincian biaya per siklus (opsional, satu per baris: <code>deskripsi | nominal</code>) — jadi baris tagihan & menimpa total</label><textarea name="breakdown" rows={3} defaultValue={(o?.breakdown ?? []).map((b) => `${b.description} | ${b.amount}`).join("\n")} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2000000\nMaintenance Aplikasi | 2500000"} /></div>
      <div className="sm:col-span-3"><label className="label">Daftar item (satu per baris, mis. subdomain yang di-host)</label><textarea name="items" rows={4} defaultValue={(o?.items ?? []).join("\n")} className="input-dark font-mono text-xs" placeholder={"app.contoh.com\napi.contoh.com"} /></div>
      <div className="sm:col-span-3"><label className="label">Ditagihkan kepada (tujuan invoice; kosong = nama akun)</label><input name="billTo" maxLength={160} defaultValue={o?.billTo ?? ""} placeholder="mis. Adzkia Smart / Bimbel Adzkia Kedinasan" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Catatan untuk pelanggan (tampil di portal)</label><textarea name="adminNote" rows={3} maxLength={2000} defaultValue={o?.adminNote ?? ""} className="input-dark" /></div>
    </>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ edit?: string; status?: string; new?: string }> }) {
  const user = await requirePermissionPage("order.read");
  const { edit, status, new: isNew } = await searchParams;
  const all = await listOrders();
  const rows = status && status in ORDER_STATUS ? all.filter((o) => o.status === status) : all;
  const o = edit ? all.find((r) => r.id === edit) : undefined;
  const canCreate = can(user, "order.create");
  const [customers, packages] = isNew && canCreate ? await Promise.all([listCustomers(), listPackages()]) : [[], []];

  return (
    <>
      <PageTitle sub="Pesanan dari portal pelanggan atau dibuat admin. Konfirmasi → status Aktif, isi detail langganan (harga kesepakatan, masa berlaku, daftar domain/subdomain), lalu buat tagihan.">Order & Langganan</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href="/admin/orders" className={`btn-ghost btn-sm ${!status ? "!border-cyan-400" : ""}`}>Semua ({all.length})</Link>
        {orderStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`btn-ghost btn-sm ${status === s ? "!border-cyan-400" : ""}`}>{ORDER_STATUS[s].label} ({all.filter((x) => x.status === s).length})</Link>
        ))}
        {canCreate && <Link href="/admin/orders?new=1" className="btn-primary btn-sm ml-auto">+ Order manual</Link>}
      </div>
      {isNew && canCreate && (
        <Card title="Buat order / langganan untuk pelanggan" right={<Link href="/admin/orders" className="btn-ghost btn-sm">Tutup</Link>}>
          <form action={createOrderAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Pelanggan *</label>
                <select name="userId" required className="input-dark" defaultValue="">
                  <option value="" disabled>pilih pelanggan</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ""} ({c.email})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Paket *</label>
                <select name="packageId" required className="input-dark" defaultValue="">
                  <option value="" disabled>pilih paket</option>
                  {packages.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.price > 0 ? fmtIDR(p.price) : "harga kesepakatan"} {CYCLE[p.billingCycle]}{p.unit ? ` / ${p.unit}` : ""}</option>)}
                </select>
              </div>
              <div><label className="label">Jumlah</label><input name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark" /></div>
              <SubscriptionFields />
            </div>
            <button className="btn-primary">Buat order</button>
          </form>
        </Card>
      )}
      {o && can(user, "order.update") && (
        <Card title={`Proses order ${o.number} — ${o.customerName}`} right={<Link href="/admin/orders" className="btn-ghost btn-sm">Tutup</Link>}>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="label">Paket</span>{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`} · {orderTotal(o) > 0 ? `${fmtIDR(orderTotal(o))} ${CYCLE[o.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}{o.unitPrice != null && o.price != null && o.unitPrice !== o.price && <span className="text-xs text-slate-500"> (harga paket {fmtIDR(o.price)})</span>}</div>
            <div><span className="label">Pelanggan</span>{o.customerName} · {o.customerEmail}</div>
            <div className="sm:col-span-2"><span className="label">Brief pelanggan</span><p className="whitespace-pre-line text-slate-300">{o.notes || "—"}</p></div>
          </div>
          <form action={updateOrderAction} className="space-y-4" key={o.id}>
            <input type="hidden" name="id" value={o.id} />
            <div className="grid gap-4 sm:grid-cols-3"><SubscriptionFields o={o} /></div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary">Simpan</button>
              {can(user, "invoice.create") && (
                <Link
                  href={`/admin/invoices?new=1&userId=${o.userId}&orderId=${o.id}&title=${encodeURIComponent(`${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""} — ${o.number}`)}&amount=${orderTotal(o)}&period=${o.billingCycle === "monthly" ? currentPeriod() : ""}`}
                  className="btn-magenta"
                >
                  Buat tagihan untuk order ini →
                </Link>
              )}
            </div>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Nomor</th><th className={th}>Pelanggan</th><th className={th}>Paket</th><th className={th}>Langganan</th><th className={th}>Status</th><th className={th}>Dibuat</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className={`${td} font-mono text-xs text-cyan-300`}>{r.number}</td>
                <td className={td}><div className="text-white">{r.customerName}</div><div className="text-xs text-slate-500">{r.customerEmail}</div></td>
                <td className={td}>{r.packageName}{r.quantity > 1 && ` ×${r.quantity}`}<div className="text-xs text-slate-500">{orderTotal(r) > 0 ? `${fmtIDR(orderTotal(r))} ${CYCLE[r.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}{r.unitPrice != null && r.quantity > 1 && ` (${fmtIDR(orderUnitPrice(r))}/unit)`}</div></td>
                <td className={`${td} text-xs text-slate-400`}>
                  {r.startDate && <div>{r.startDate}{r.endDate && ` → ${r.endDate}`}</div>}
                  {(r.items.length > 0 || r.itemLimit != null) && <div>{r.items.length}{r.itemLimit != null && `/${r.itemLimit}`} {r.itemLabel || "item"}</div>}
                  {!r.startDate && !r.items.length && r.itemLimit == null && "—"}
                </td>
                <td className={td}><Badge tone={ORDER_STATUS[r.status].tone}>{ORDER_STATUS[r.status].label}</Badge></td>
                <td className={`${td} text-xs text-slate-400`}>{fmtDateTime(r.createdAt)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, "order.update") && <Link href={`/admin/orders?edit=${r.id}`} className="btn-ghost btn-sm">Proses</Link>}
                    {can(user, "order.delete") && <form action={deleteOrderAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={7}>Belum ada order.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
