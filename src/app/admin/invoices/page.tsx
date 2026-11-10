import Link from "next/link";
import { MoneyInput } from "@/components/lc/money-input";
import { Modal } from "@/components/lc/modal";
import { Badge, Info, List, PageTitle, RowLink, Stat, fmtDate, fmtDateTime, type Tone } from "@/components/lc/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteInvoiceAction, generateMonthlyInvoicesAction, saveInvoiceAction, setInvoiceStatusAction } from "@/modules/billing/actions";
import { CYCLE, INVOICE_STATUS, currentPeriod, daysUntil, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { daysText, daysTone, serviceState } from "@/modules/billing/service-state";
import { customerOptions, invoiceInternalNotes, listInvoices, listOrders, orderTotal, type InvoiceRow, type OrderRow } from "@/modules/billing/repository";

type Q = { u?: string; edit?: string; new?: string; svc?: string; gen?: string; userId?: string; orderId?: string; title?: string; amount?: string; period?: string; status?: string };

type Group = {
  key: string; userId: string; title: string; customer: string; email: string; order?: OrderRow; state?: ReturnType<typeof serviceState>;
  invoices: InvoiceRow[]; unpaid: number; verifying: number; openTotal: number; nextDue: string | null; label: string; tone: Tone;
};

/** Kelompokkan tagihan per layanan (order); tagihan tanpa layanan dikelompokkan per pelanggan. */
function groupByService(all: InvoiceRow[], orders: OrderRow[]): Group[] {
  const byOrder = new Map(orders.map((o) => [o.id, o]));
  const map = new Map<string, InvoiceRow[]>();
  for (const i of all) {
    const key = i.orderId && byOrder.has(i.orderId) ? i.orderId : `u-${i.userId}`;
    (map.get(key) ?? map.set(key, []).get(key)!).push(i);
  }
  const out: Group[] = [];
  for (const [key, list] of map) {
    const invoices = [...list].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    const first = invoices[0]!;
    const order = key.startsWith("u-") ? undefined : byOrder.get(key);
    const open = invoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification");
    const unpaid = invoices.filter((i) => i.status === "unpaid").length;
    const verifying = invoices.filter((i) => i.status === "pending_verification").length;
    const nextDue = open.map((i) => i.dueDate).sort()[0] ?? null;
    const overdue = invoices.some((i) => isOverdue(i.dueDate, i.status));
    const [label, tone]: [string, Tone] = verifying ? ["Menunggu verifikasi", "cyan"] : overdue ? ["Lewat jatuh tempo", "rose"] : unpaid ? ["Belum bayar", "amber"] : ["Lunas", "emerald"];
    out.push({
      key, userId: first.userId, order, state: order ? serviceState(order, all) : undefined, invoices, unpaid, verifying, nextDue, label, tone,
      title: order ? `${order.packageName}${order.quantity > 1 ? ` ×${order.quantity}` : ""}` : "Tagihan lain (manual)",
      customer: order?.billTo || first.billTo || first.customerName, email: first.customerEmail,
      openTotal: open.reduce((s, i) => s + i.amount, 0),
    });
  }
  // yang perlu ditindaklanjuti dulu (jatuh tempo terdekat), lalu yang sudah lunas
  return out.sort((a, b) => (a.nextDue ? 0 : 1) - (b.nextDue ? 0 : 1) || (a.nextDue ?? "").localeCompare(b.nextDue ?? "") || a.title.localeCompare(b.title));
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Q> }) {
  const user = await requirePermissionPage("invoice.read");
  const q = await searchParams;
  const [all, customers, orders, internalNotes] = await Promise.all([listInvoices(), customerOptions(), listOrders(), invoiceInternalNotes()]);
  const groups = groupByService(all, orders);
  const FILTERS = { open: "Belum bayar", verify: "Menunggu verifikasi", paid: "Lunas" } as const;
  const f = q.status && q.status in FILTERS ? (q.status as keyof typeof FILTERS) : null;
  // filter per pelanggan (?u=userId), digabung dengan filter status
  const people = [...new Map(groups.map((g) => [g.userId, g.customer])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const uid = q.u && people.some(([id]) => id === q.u) ? q.u : null;
  const hrefOf = (status: string | null, u: string | null) => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (u) p.set("u", u);
    return p.size ? `/admin/invoices?${p}` : "/admin/invoices";
  };
  const byUser = uid ? groups.filter((g) => g.userId === uid) : groups;
  const match = (g: Group, k: keyof typeof FILTERS) => (k === "open" ? g.unpaid > 0 : k === "verify" ? g.verifying > 0 : g.unpaid === 0 && g.verifying === 0);
  const rows = byUser.filter((g) => !f || match(g, f));
  const listHref = hrefOf(f, uid);
  const sel = q.svc ? groups.find((g) => g.key === q.svc) : undefined;
  const inv = q.edit ? all.find((r) => r.id === q.edit) : undefined;
  const showForm = !!inv || q.new === "1";
  const canWrite = can(user, `invoice.${inv ? "update" : "create"}`);
  const due = new Date(); due.setDate(due.getDate() + 7);
  const preset = {
    userId: inv?.userId ?? q.userId ?? "",
    orderId: inv?.orderId ?? q.orderId ?? "",
    title: inv?.title ?? q.title ?? "",
    billTo: inv?.billTo ?? "",
    billToEmail: inv?.billToEmail ?? "",
    amount: inv?.amount ?? (q.amount ? Number(q.amount) : ""),
    period: inv?.period ?? q.period ?? "",
    dueDate: inv?.dueDate ?? due.toISOString().slice(0, 10),
    note: inv?.note ?? "",
    items: (inv?.items ?? []).map((i) => `${i.description} | ${new Intl.NumberFormat("id-ID").format(i.amount)}${i.note ? ` | ${i.note}` : ""}`).join("\n"),
    paidAt: inv?.paidAt ? new Date(inv.paidAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : "",
  };
  const totals = { unpaid: all.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0), verifying: all.filter((i) => i.status === "pending_verification").length };

  return (
    <>
      <PageTitle
        sub="Tagihan dikelompokkan per layanan. Klik satu layanan untuk melihat semua invoice-nya, menandai lunas, atau mencetak."
        actions={can(user, "invoice.create") ? <>
          <Link href="/admin/invoices?gen=1" scroll={false} className="btn-ghost btn-sm">Generate bulanan</Link>
          <Link href="/admin/invoices?new=1" scroll={false} className="btn-primary btn-sm">+ Tagihan manual</Link>
        </> : undefined}
      >Tagihan</PageTitle>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Stat label="Belum dibayar" value={fmtIDR(totals.unpaid)} href="/admin/invoices?status=open" />
        <Stat label="Menunggu verifikasi" value={totals.verifying} href="/admin/invoices?status=verify" />
        <Stat label="Layanan ditagih" value={groups.length} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href={hrefOf(null, uid)} className={`btn-sm ${!f ? "btn-primary" : "btn-ghost"}`}>Semua ({byUser.length})</Link>
        {(Object.keys(FILTERS) as (keyof typeof FILTERS)[]).map((k) => (
          <Link key={k} href={hrefOf(k, uid)} className={`btn-sm ${f === k ? "btn-primary" : "btn-ghost"}`}>
            {FILTERS[k]} ({byUser.filter((g) => match(g, k)).length})
          </Link>
        ))}
      </div>

      {people.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--ink-3)]">Pelanggan:</span>
          <Link href={hrefOf(f, null)} className={`btn-sm ${!uid ? "btn-primary" : "btn-ghost"}`}>Semua</Link>
          {people.map(([id, name]) => (
            <Link key={id} href={hrefOf(f, id)} className={`btn-sm ${uid === id ? "btn-primary" : "btn-ghost"}`}>{name}</Link>
          ))}
        </div>
      )}

      {q.gen === "1" && can(user, "invoice.create") && (
        <Modal title="Generate tagihan bulanan" close="/admin/invoices">
          <form action={generateMonthlyInvoicesAction} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Periode</label><input name="period" type="month" defaultValue={currentPeriod()} className="input-dark" /></div>
              <div><label className="label">Tgl jatuh tempo (cadangan)</label><input name="dueDay" type="number" min={1} max={28} defaultValue={15} className="input-dark" /></div>
            </div>
            <p className="text-xs text-[var(--ink-3)]">Membuat tagihan untuk semua layanan <b>aktif</b> berpaket bulanan yang belum ditagih di periode itu. Jatuh tempo mengikuti tanggal mulai layanan; isian di atas dipakai bila layanan tanpa tanggal mulai.</p>
            <button className="btn-primary">Generate</button>
          </form>
        </Modal>
      )}

      {showForm && canWrite && (
        <Modal title={inv ? `Edit tagihan ${inv.number}` : "Tagihan baru"} close={q.svc ? `/admin/invoices?svc=${q.svc}` : "/admin/invoices"} wide>
          <form action={saveInvoiceAction} className="space-y-4" key={inv?.id ?? "new"}>
            {inv && <input type="hidden" name="id" value={inv.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Pelanggan *</label>
                <select name="userId" required defaultValue={preset.userId} className="input-dark">
                  <option value="">— pilih —</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Order terkait (opsional)</label>
                <select name="orderId" defaultValue={preset.orderId} className="input-dark">
                  <option value="">—</option>
                  {orders.filter((o) => o.status !== "cancelled").map((o) => <option key={o.id} value={o.id}>{o.number} · {o.customerName} · {o.packageName}</option>)}
                </select>
              </div>
              <div><label className="label">Periode (YYYY-MM, kosong = sekali)</label><input name="period" type="month" defaultValue={preset.period} className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Ditagihkan kepada (kosong = ikut order / nama akun)</label><input name="billTo" maxLength={160} defaultValue={preset.billTo} placeholder="mis. Adzkia Smart / Bimbel Adzkia Kedinasan" className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Email tujuan tagihan (kosong = ikut order / email akun)</label><input name="billToEmail" type="email" maxLength={160} defaultValue={preset.billToEmail} placeholder="mis. keuangan@klien.com" className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Judul tagihan *</label><input name="title" required minLength={2} maxLength={255} defaultValue={preset.title} placeholder="Sewa Server — Oktober 2026" className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Rincian baris (opsional, satu per baris: <code>deskripsi | nominal | keterangan</code>; keterangan opsional, mis. &quot;Sekali bayar · jatuh tempo 9 Nov 2026&quot;; nominal tagihan otomatis = jumlahnya)</label><textarea name="items" rows={3} defaultValue={preset.items} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2000000\nMaintenance Aplikasi | 2500000"} /></div>
              <div><label className="label">Nominal (Rp){" "}<span className="text-[var(--ink-3)]">(diabaikan bila ada rincian)</span></label><MoneyInput name="amount" defaultValue={preset.amount} /></div>
              <div><label className="label">Jatuh tempo *</label><input name="dueDate" type="date" required defaultValue={preset.dueDate} className="input-dark" /></div>
              <div><label className="label">Tanggal dibayar (isi = tandai lunas)</label><input name="paidAt" type="date" defaultValue={preset.paidAt} className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Catatan (tampil ke pelanggan)</label><input name="note" maxLength={2000} defaultValue={preset.note} className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">🔒 Catatan internal (hanya admin, tidak tampil ke pelanggan)</label><textarea name="internalNote" rows={3} maxLength={4000} defaultValue={inv ? internalNotes[inv.id] ?? "" : ""} placeholder="mis. Rp 2.000.000 uang server · Rp 220.000 pajak server · Rp 4.000 pajak QRIS" className="input-dark" /></div>
            </div>
            <button className="btn-primary">{inv ? "Simpan perubahan" : "Buat tagihan"}</button>
          </form>
        </Modal>
      )}

      {sel && !showForm && (
        <Modal title={sel.title} close={listHref} wide>
          <div className="detail-section">
            <div className="mb-4 flex flex-wrap items-center gap-2"><Badge tone={sel.tone}>{sel.label}</Badge>{sel.order && <span className="font-mono text-xs text-[var(--ink-3)]">{sel.order.number}</span>}</div>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Info label="Pelanggan">{sel.customer}<span className="block text-xs text-[var(--ink-3)]">{sel.email}</span></Info>
              <Info label="Biaya layanan">{sel.order ? <><span className="num font-bold">{orderTotal(sel.order) > 0 ? fmtIDR(orderTotal(sel.order)) : "—"}</span> <span className="text-xs text-[var(--ink-3)]">{CYCLE[sel.order.billingCycle ?? "once"]}</span></> : "Tagihan manual"}</Info>
              <Info label="Belum dibayar"><span className="num font-bold">{fmtIDR(sel.openTotal)}</span></Info>
              {sel.state && <Info label="Aktif s.d.">{sel.state.paidUntil ? fmtDate(sel.state.paidUntil) : sel.order?.endDate ? fmtDate(sel.order.endDate) : "—"}{sel.state.leftActive != null && <span className="mt-1 block"><Badge tone={daysTone(sel.state.leftActive)}>{daysText(sel.state.leftActive)}</Badge></span>}</Info>}
              <Info label="Jatuh tempo berikutnya">{sel.nextDue ? <>{fmtDate(sel.nextDue)}<span className="mt-1 block"><Badge tone={daysTone(daysUntil(sel.nextDue))}>{daysText(daysUntil(sel.nextDue))}</Badge></span></> : "Tidak ada"}</Info>
              <Info label="Jumlah invoice">{sel.invoices.length}</Info>
            </dl>
          </div>

          <div className="detail-section">
            <p className="detail-title">Daftar invoice</p>
            <ol className="space-y-3">
              {sel.invoices.map((r, k) => {
                const late = isOverdue(r.dueDate, r.status);
                return (
                  <li key={r.id} className="rounded-lg border border-[var(--line)] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--ink)]"><span className="num mr-2 text-xs text-[var(--ink-3)]">{k + 1}.</span>{r.period ? fmtPeriod(r.period) : r.title}</p>
                        <p className="pl-5 font-mono text-[11px] text-[var(--ink-3)]">{r.number} · dibuat {fmtDateTime(r.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="num font-bold text-[var(--ink)]">{fmtIDR(r.amount)}</p>
                        <Badge tone={INVOICE_STATUS[r.status].tone}>{INVOICE_STATUS[r.status].label}</Badge>
                      </div>
                    </div>
                    {r.items.length > 0 && <ul className="mt-2 space-y-0.5 pl-5 text-xs text-[var(--ink-3)]">{r.items.map((i, n) => <li key={n}>· {i.description} — {fmtIDR(i.amount)}{i.note && ` (${i.note})`}</li>)}</ul>}
                    {internalNotes[r.id] && <p className="mt-2 whitespace-pre-line rounded border border-dashed border-[var(--line)] px-2 py-1 pl-5 text-xs text-[var(--ink-2)]"><b>🔒 Internal:</b> {internalNotes[r.id]}</p>}
                    <p className={`mt-2 pl-5 text-xs ${late ? "text-[var(--bad)]" : "text-[var(--ink-3)]"}`}>
                      Jatuh tempo {fmtDate(r.dueDate)}{r.status !== "paid" && r.status !== "cancelled" && ` · ${daysText(daysUntil(r.dueDate))}`}
                      {r.paidAt && <span className="text-[var(--ok)]"> · lunas {fmtDateTime(r.paidAt)}</span>}
                      {r.proofFileId && <> · <a href={`/api/files/${r.proofFileId}`} target="_blank" rel="noreferrer" className="text-[var(--brand-ink)] hover:underline">bukti bayar ↗</a></>}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 pl-5">
                      {can(user, "invoice.update") && r.status !== "paid" && r.status !== "cancelled" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="paid" /><button className="btn-primary btn-sm">Tandai lunas</button></form>
                      )}
                      {can(user, "invoice.update") && r.status === "paid" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="unpaid" /><button className="btn-ghost btn-sm">Batal lunas</button></form>
                      )}
                      {can(user, "invoice.update") && r.status === "unpaid" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn-ghost btn-sm">Batalkan</button></form>
                      )}
                      <a href={`/invoice/${r.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Cetak</a>
                      {can(user, "invoice.update") && <Link href={`/admin/invoices?edit=${r.id}&svc=${sel.key}`} scroll={false} className="btn-ghost btn-sm">Edit</Link>}
                      {can(user, "invoice.delete") && <form action={deleteInvoiceAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {can(user, "invoice.create") && sel.order && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
              <Link href={`/admin/invoices?new=1&svc=${sel.key}&userId=${sel.order.userId}&orderId=${sel.order.id}&title=${encodeURIComponent(`${sel.order.packageName}${sel.order.quantity > 1 ? ` ×${sel.order.quantity}` : ""} — ${sel.order.number}`)}&amount=${orderTotal(sel.order)}&period=${sel.order.billingCycle === "monthly" ? currentPeriod() : ""}`} scroll={false} className="btn-gold btn-sm">+ Tagihan untuk layanan ini</Link>
              <Link href={`/admin/orders?view=${sel.order.id}`} className="btn-ghost btn-sm">Detail layanan</Link>
            </div>
          )}
        </Modal>
      )}

      <List count={rows.length} label="layanan">
        {rows.map((g, k) => (
          <RowLink key={g.key} no={k + 1} href={`${listHref}${listHref.includes("?") ? "&" : "?"}svc=${g.key}`}
            right={<span className="hidden text-right sm:block"><span className="num block text-sm font-bold text-[var(--ink)]">{g.openTotal > 0 ? fmtIDR(g.openTotal) : "Lunas"}</span><span className="text-xs text-[var(--ink-3)]">{g.invoices.length} invoice</span></span>}>
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-semibold text-[var(--ink)]">{g.title}</span>
              <Badge tone={g.tone}>{g.label}</Badge>
            </span>
            <span className="mt-0.5 block truncate text-xs text-[var(--ink-3)]">
              {g.customer}
              {g.nextDue && <> · jatuh tempo {fmtDate(g.nextDue)} <span className={daysUntil(g.nextDue) < 0 ? "text-[var(--bad)]" : daysUntil(g.nextDue) <= 7 ? "text-[var(--warn)]" : ""}>({daysText(daysUntil(g.nextDue))})</span></>}
              <span className="sm:hidden"> · {g.openTotal > 0 ? fmtIDR(g.openTotal) : "lunas"}</span>
            </span>
          </RowLink>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-[var(--ink-3)]">Tidak ada tagihan.</li>}
      </List>
    </>
  );
}
