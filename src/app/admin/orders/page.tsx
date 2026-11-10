import Link from "next/link";
import { MoneyInput } from "@/components/lc/money-input";
import { Modal } from "@/components/lc/modal";
import { Badge, Info, List, PageTitle, RowLink, fmtDate } from "@/components/lc/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { createOrderAction, deleteOrderAction, updateOrderAction } from "@/modules/billing/actions";
import { CYCLE, INVOICE_STATUS, ORDER_STATUS, currentPeriod, fmtIDR, fmtPeriod } from "@/modules/billing/labels";
import { daysText, daysTone, serviceState } from "@/modules/billing/service-state";
import { listCustomers, listInvoices, listOrders, listPackages, orderTotal, orderUnitPrice, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";
import { orderStatus } from "@/modules/billing/schema";

/** Field langganan yang sama untuk form proses & order manual. */
function SubscriptionFields({ o }: { o?: OrderRow }) {
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
      <div><label className="label">Berakhir / lunas s.d.</label><input name="endDate" type="date" defaultValue={o?.endDate ?? ""} className="input-dark" /><p className="mt-1 text-xs text-[var(--ink-3)]">Untuk sewa tahunan/kontrak; portal menampilkan sisa waktu.</p></div>
      <div><label className="label">Harga kesepakatan / unit (Rp)</label><MoneyInput name="unitPrice" defaultValue={o?.unitPrice} placeholder={o?.price ? `kosong = harga paket ${fmtIDR(o.price)}` : "kosong = harga paket"} /></div>
      <div><label className="label">Sebutan item</label><input name="itemLabel" maxLength={32} defaultValue={o?.itemLabel ?? ""} placeholder="subdomain / domain / nomor" className="input-dark" /></div>
      <div><label className="label">Limit item</label><input name="itemLimit" type="number" min={0} max={100000} defaultValue={o?.itemLimit ?? ""} placeholder="kosong = tanpa batas" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Rincian biaya per siklus (opsional, satu per baris: <code>deskripsi | nominal</code>) — jadi baris tagihan & menimpa total</label><textarea name="breakdown" rows={3} defaultValue={(o?.breakdown ?? []).map((b) => `${b.description} | ${new Intl.NumberFormat("id-ID").format(b.amount)}${b.note ? ` | ${b.note}` : ""}`).join("\n")} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2.000.000\nMaintenance Aplikasi | 2.500.000"} /></div>
      <div className="sm:col-span-3"><label className="label">Daftar item (satu per baris, mis. subdomain yang di-host)</label><textarea name="items" rows={4} defaultValue={(o?.items ?? []).join("\n")} className="input-dark font-mono text-xs" placeholder={"app.contoh.com\napi.contoh.com"} /></div>
      <div className="sm:col-span-3"><label className="label">Ditagihkan kepada (tujuan invoice; kosong = nama akun)</label><input name="billTo" maxLength={160} defaultValue={o?.billTo ?? ""} placeholder="mis. Adzkia Smart / Bimbel Adzkia Kedinasan" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Email tujuan tagihan (kosong = email akun; diisi = invoice tidak menampilkan email/telepon/alamat akun)</label><input name="billToEmail" type="email" maxLength={160} defaultValue={o?.billToEmail ?? ""} placeholder="mis. keuangan@klien.com" className="input-dark" /></div>
      <div className="sm:col-span-3"><label className="label">Catatan untuk pelanggan (tampil di portal)</label><textarea name="adminNote" rows={3} maxLength={2000} defaultValue={o?.adminNote ?? ""} className="input-dark" /></div>
    </>
  );
}

/** Detail lengkap satu layanan: ringkasan, masa aktif, rincian biaya, item, dan riwayat tagihan. */
function DetailModal({ o, invoices, close, canEdit, canInvoice, canDelete }: { o: OrderRow; invoices: InvoiceRow[]; close: string; canEdit: boolean; canInvoice: boolean; canDelete: boolean }) {
  const s = serviceState(o, invoices);
  const total = orderTotal(o);
  const all = invoices.filter((i) => i.orderId === o.id).sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  return (
    <Modal title={`${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""}`} close={close} wide>
      <div className="detail-section">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={s.status.tone}>{s.status.label}</Badge>
          <span className="font-mono text-xs text-[var(--ink-3)]">{o.number}</span>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Info label="Pelanggan">{o.customerName}<span className="block text-xs text-[var(--ink-3)]">{o.customerEmail}</span></Info>
          <Info label="Ditagihkan kepada">{o.billTo || o.customerName}{o.billToEmail && <span className="block text-xs text-[var(--ink-3)]">{o.billToEmail}</span>}</Info>
          <Info label="Biaya"><span className="num font-bold">{total > 0 ? fmtIDR(total) : "Sesuai kesepakatan"}</span> <span className="text-xs text-[var(--ink-3)]">{CYCLE[s.cycle]}</span>{o.unitPrice != null && o.quantity > 1 && <span className="block text-xs text-[var(--ink-3)]">{fmtIDR(orderUnitPrice(o))} / unit</span>}</Info>
          <Info label="Mulai layanan">{o.startDate ? fmtDate(o.startDate) : "—"}</Info>
        </dl>
      </div>

      <div className="detail-section">
        <p className="detail-title">Masa aktif & perpanjangan</p>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Info label="Aktif s.d.">{s.paidUntil ? fmtDate(s.paidUntil) : o.endDate ? fmtDate(o.endDate) : "—"}{s.leftActive != null && <span className="mt-1 block"><Badge tone={daysTone(s.leftActive)}>{daysText(s.leftActive)}</Badge></span>}</Info>
          <Info label="Tagihan berikutnya">{s.next ? <>{fmtDate(s.next.dueDate)}<span className="block text-xs text-[var(--ink-3)]">{fmtIDR(s.next.amount)}</span></> : "Tidak ada"}</Info>
          <Info label="Sisa hari ke jatuh tempo">{s.left != null ? <Badge tone={daysTone(s.left)}>{daysText(s.left)}</Badge> : "—"}</Info>
        </dl>
      </div>

      {(o.breakdown.length > 0 || o.items.length > 0 || o.itemLimit != null) && (
        <div className="detail-section">
          <p className="detail-title">Rincian</p>
          {o.breakdown.length > 0 && (
            <ul className="mb-3 divide-y divide-[var(--line)] text-sm">
              {o.breakdown.map((b, k) => <li key={k} className="flex justify-between gap-3 py-1.5"><span className="text-[var(--ink-2)]">{b.description}{b.note && <span className="block text-xs text-[var(--ink-3)]">{b.note}</span>}</span><span className="num whitespace-nowrap">{fmtIDR(b.amount)}</span></li>)}
            </ul>
          )}
          {(o.items.length > 0 || o.itemLimit != null) && <p className="text-sm text-[var(--ink-2)]"><b>{o.itemLabel || "Item"}</b> ({o.items.length}{o.itemLimit != null && `/${o.itemLimit}`}): <span className="font-mono text-xs">{o.items.join(", ") || "—"}</span></p>}
        </div>
      )}

      {(o.notes || o.adminNote) && (
        <div className="detail-section">
          <p className="detail-title">Catatan</p>
          {o.notes && <p className="whitespace-pre-line text-sm text-[var(--ink-2)]"><b>Brief pelanggan:</b> {o.notes}</p>}
          {o.adminNote && <p className="mt-2 whitespace-pre-line text-sm text-[var(--ink-2)]"><b>Untuk pelanggan:</b> {o.adminNote}</p>}
        </div>
      )}

      <div className="detail-section">
        <p className="detail-title">Riwayat tagihan ({all.length})</p>
        {all.length ? (
          <ol className="divide-y divide-[var(--line)] text-sm">
            {all.map((i, k) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0"><span className="num mr-2 text-xs text-[var(--ink-3)]">{k + 1}.</span>{i.period ? fmtPeriod(i.period) : i.title}<span className="block pl-5 font-mono text-[11px] text-[var(--ink-3)]">{i.number} · jatuh tempo {fmtDate(i.dueDate)}</span></span>
                <span className="flex items-center gap-2"><span className="num font-semibold">{fmtIDR(i.amount)}</span><Badge tone={INVOICE_STATUS[i.status].tone}>{INVOICE_STATUS[i.status].label}</Badge><a href={`/invoice/${i.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Cetak</a></span>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-[var(--ink-3)]">Belum ada tagihan untuk layanan ini.</p>}
        <Link href={`/admin/invoices?svc=${o.id}`} className="mt-3 inline-block text-sm font-semibold text-[var(--brand-ink)] hover:underline">Kelola pembayaran di halaman Tagihan →</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
        {canEdit && <Link href={`/admin/orders?edit=${o.id}`} scroll={false} className="btn-primary btn-sm">Edit layanan</Link>}
        {canInvoice && (
          <Link href={`/admin/invoices?new=1&userId=${o.userId}&orderId=${o.id}&title=${encodeURIComponent(`${o.packageName}${o.quantity > 1 ? ` ×${o.quantity}` : ""} — ${o.number}`)}&amount=${total}&period=${o.billingCycle === "monthly" ? currentPeriod() : ""}`} className="btn-gold btn-sm">+ Buat tagihan</Link>
        )}
        {canDelete && <form action={deleteOrderAction} className="ml-auto"><input type="hidden" name="id" value={o.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
      </div>
    </Modal>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ edit?: string; status?: string; new?: string; view?: string }> }) {
  const user = await requirePermissionPage("order.read");
  const { edit, status, new: isNew, view } = await searchParams;
  const [all, invoices] = await Promise.all([listOrders(), listInvoices()]);
  const rows = status && status in ORDER_STATUS ? all.filter((o) => o.status === status) : all;
  const o = edit ? all.find((r) => r.id === edit) : undefined;
  const v = view ? all.find((r) => r.id === view) : undefined;
  const back = status ? `/admin/orders?status=${status}` : "/admin/orders";
  const canCreate = can(user, "order.create");
  const [customers, packages] = isNew && canCreate ? await Promise.all([listCustomers(), listPackages()]) : [[], []];

  return (
    <>
      <PageTitle sub="Semua layanan pelanggan. Klik satu layanan untuk detail lengkap, masa aktif, dan riwayat tagihannya." actions={canCreate ? <Link href="/admin/orders?new=1" scroll={false} className="btn-primary btn-sm">+ Layanan manual</Link> : undefined}>Layanan</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href="/admin/orders" className={`btn-sm ${!status ? "btn-primary" : "btn-ghost"}`}>Semua ({all.length})</Link>
        {orderStatus.enumValues.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`btn-sm ${status === s ? "btn-primary" : "btn-ghost"}`}>{ORDER_STATUS[s].label} ({all.filter((x) => x.status === s).length})</Link>
        ))}
      </div>
      {isNew && canCreate && (
        <Modal title="Tambah layanan untuk pelanggan" close="/admin/orders" wide>
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
                <label className="label">Nama layanan / paket *</label>
                <input name="packageName" required minLength={2} maxLength={128} list="pkg-list" autoComplete="off" placeholder="ketik bebas, mis. Sewa Server + Maintenance" className="input-dark" />
                <datalist id="pkg-list">{packages.map((p) => <option key={p.id} value={p.name}>{p.price > 0 ? `${fmtIDR(p.price)} ${CYCLE[p.billingCycle]}` : "harga kesepakatan"}</option>)}</datalist>
                <p className="mt-1 text-xs text-[var(--ink-3)]">Boleh diketik sendiri. Bila sama dengan nama paket, harganya ikut paket; isi “Harga kesepakatan” untuk harga sendiri.</p>
              </div>
              <div><label className="label">Jumlah</label><input name="quantity" type="number" min={1} max={100} defaultValue={1} className="input-dark" /></div>
              <SubscriptionFields />
            </div>
            <button className="btn-primary">Buat order</button>
          </form>
        </Modal>
      )}
      {o && can(user, "order.update") && (
        <Modal title={`Edit layanan ${o.number} — ${o.customerName}`} close={`/admin/orders?view=${o.id}`} wide>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
            <div><span className="label">Paket</span>{o.packageName}{o.quantity > 1 && ` ×${o.quantity}`} · {orderTotal(o) > 0 ? `${fmtIDR(orderTotal(o))} ${CYCLE[o.billingCycle ?? "once"]}` : "harga sesuai kesepakatan"}{o.unitPrice != null && o.price != null && o.unitPrice !== o.price && <span className="text-xs text-[var(--ink-3)]"> (harga paket {fmtIDR(o.price)})</span>}</div>
            <div><span className="label">Pelanggan</span>{o.customerName} · {o.customerEmail}</div>
            <div className="sm:col-span-2"><span className="label">Brief pelanggan</span><p className="whitespace-pre-line text-[var(--ink-2)]">{o.notes || "—"}</p></div>
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
        </Modal>
      )}
      {v && <DetailModal o={v} invoices={invoices} close={back} canEdit={can(user, "order.update")} canInvoice={can(user, "invoice.create")} canDelete={can(user, "order.delete")} />}

      <List count={rows.length} label="layanan">
        {rows.map((r, k) => {
          const s = serviceState(r, invoices);
          const total = orderTotal(r);
          return (
            <RowLink key={r.id} no={k + 1} href={`${back}${back.includes("?") ? "&" : "?"}view=${r.id}`} dim={r.status === "cancelled"}
              right={<span className="hidden text-right sm:block"><span className="num block text-sm font-bold text-[var(--ink)]">{total > 0 ? fmtIDR(total) : "—"}</span><span className="text-xs text-[var(--ink-3)]">{CYCLE[s.cycle]}</span></span>}>
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate font-semibold text-[var(--ink)]">{r.packageName}{r.quantity > 1 && ` ×${r.quantity}`}</span>
                <Badge tone={s.status.tone}>{s.status.label}</Badge>
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--ink-3)]">
                {r.billTo || r.customerName}
                {s.next && s.left != null && <> · jatuh tempo {fmtDate(s.next.dueDate)} <span className={s.left < 0 ? "text-[var(--bad)]" : s.left <= 7 ? "text-[var(--warn)]" : ""}>({daysText(s.left)})</span></>}
                {!s.next && s.paidUntil && <> · aktif s.d. {fmtDate(s.paidUntil)}</>}
                <span className="sm:hidden"> · {total > 0 ? fmtIDR(total) : "—"}</span>
              </span>
            </RowLink>
          );
        })}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-[var(--ink-3)]">Belum ada layanan.</li>}
      </List>
    </>
  );
}
