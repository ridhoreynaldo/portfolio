import Link from "next/link";
import { Modal } from "@/components/lc/modal";
import { Badge, Info, List, PageTitle, RowLink, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { InvoiceFormModal, OrderFormModal } from "./forms";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { saveCustomerAction } from "@/modules/billing/actions";
import { daysUntil, fmtIDR } from "@/modules/billing/labels";
import { CustomerServices, type AdminCtx } from "@/components/lc/service-list";
import { invoiceInternalNotes, listCustomers, listInvoices, listOrders, listPackages } from "@/modules/billing/repository";
import { daysText, serviceState } from "@/modules/billing/service-state";

type Q = { edit?: string; new?: string; view?: string; order?: string; inv?: string; o?: string; f?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Q> }) {
  const user = await requirePermissionPage("customer.read");
  const { edit, new: isNew, view, order: orderQ, inv: invQ, o: presetOrder, f } = await searchParams;
  const [allRows, allOrders, allInvoices] = await Promise.all([listCustomers(), listOrders(), listInvoices()]);
  const c = edit ? allRows.find((r) => r.id === edit) : undefined;
  const v = view ? allRows.find((r) => r.id === view) : undefined;
  const vOrders = v ? allOrders.filter((o) => o.userId === v.id) : [];
  const vInvoices = v ? allInvoices.filter((i) => i.userId === v.id) : [];
  const packages = v && orderQ === "new" ? await listPackages() : [];
  const notes: Record<string, string> = v ? await invoiceInternalNotes() : {};
  const canWrite = can(user, `customer.${c ? "update" : "create"}`);

  // ringkasan per pelanggan: jatuh tempo terdekat dari layanan aktif (tagihan terbuka, atau perpanjangan berikutnya)
  const nextDue = new Map<string, string>();
  for (const o of allOrders) {
    if (o.status !== "active") continue;
    const st = serviceState(o, allInvoices.filter((i) => i.userId === o.userId));
    const d = st.next?.dueDate ?? (st.cycle !== "once" ? st.paidUntil : null);
    const cur = nextDue.get(o.userId);
    if (d && (!cur || d < cur)) nextDue.set(o.userId, d);
  }
  const rows = f === "open" ? allRows.filter((r) => r.unpaidCount > 0) : allRows;
  const paidTotal = vInvoices.filter((i) => i.status === "paid").reduce((n, i) => n + i.amount, 0);
  const openTotal = vInvoices.filter((i) => i.status === "unpaid" || i.status === "pending_verification").reduce((n, i) => n + i.amount, 0);
  const back = v ? `/admin/customers?view=${v.id}` : "/admin/customers";
  const ctx: AdminCtx | undefined = v ? {
    customerId: v.id, notes,
    canEditOrder: can(user, "order.update"), canDeleteOrder: can(user, "order.delete"),
    canCreateInvoice: can(user, "invoice.create"), canEditInvoice: can(user, "invoice.update"), canDeleteInvoice: can(user, "invoice.delete"),
  } : undefined;
  const editOrder = v && orderQ && orderQ !== "new" ? vOrders.find((o) => o.id === orderQ) : undefined;
  const editInvoice = v && invQ && invQ !== "new" ? vInvoices.find((i) => i.id === invQ) : undefined;
  const showOrderForm = !!v && !c && (orderQ === "new" ? can(user, "order.create") : !!editOrder && can(user, "order.update"));
  const showInvoiceForm = !!v && !c && !showOrderForm && (invQ === "new" ? can(user, "invoice.create") : !!editInvoice && can(user, "invoice.update"));

  return (
    <>
      <PageTitle actions={can(user, "customer.create") ? <Link href="/admin/customers?new=1" scroll={false} className="btn-primary btn-sm">+ Akun pelanggan</Link> : undefined} sub="Semua dikelola dari sini: klik satu pelanggan untuk edit data, layanan, dan tagihannya. Hapus akun lewat menu Pengguna.">Pelanggan</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href="/admin/customers" className={`btn-sm ${f !== "open" ? "btn-primary" : "btn-ghost"}`}>Semua ({allRows.length})</Link>
        <Link href="/admin/customers?f=open" className={`btn-sm ${f === "open" ? "btn-primary" : "btn-ghost"}`}>Ada tagihan belum lunas ({allRows.filter((r) => r.unpaidCount > 0).length})</Link>
      </div>
      {canWrite && (c || isNew === "1") && (
        <Modal title={c ? `Edit: ${c.email}` : "Buat akun pelanggan"} close={c ? `/admin/customers?view=${c.id}` : "/admin/customers"}>
          <form action={saveCustomerAction} className="space-y-4" key={c?.id ?? "new"}>
            {c && <input type="hidden" name="id" value={c.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Nama *</label><input name="name" required minLength={2} maxLength={80} defaultValue={c?.name} className="input-dark" /></div>
              <div><label className="label">Email *</label><input name="email" type="email" required defaultValue={c?.email} className="input-dark" /></div>
              <div><label className="label">Password {c ? "(kosongkan jika tetap)" : "*"}</label><input name="password" type="password" minLength={8} required={!c} autoComplete="new-password" className="input-dark" /></div>
              <div><label className="label">WhatsApp</label><input name="phone" maxLength={64} defaultValue={c?.phone} className="input-dark" /></div>
              <div><label className="label">Instansi / usaha</label><input name="company" maxLength={128} defaultValue={c?.company} className="input-dark" /></div>
              <label className="flex items-center gap-2 pt-6 text-sm text-[var(--ink-2)]"><input type="checkbox" name="isActive" defaultChecked={c?.isActive ?? true} className="accent-cyan-400" /> Aktif</label>
              <div className="sm:col-span-2"><label className="label">Alamat</label><textarea name="address" rows={2} maxLength={1000} defaultValue={c?.address} className="input-dark" /></div>
              <div><label className="label">Catatan internal</label><textarea name="notes" rows={2} maxLength={2000} defaultValue={c?.notes} className="input-dark" /></div>
            </div>
            <button className="btn-primary">{c ? "Simpan" : "Buat akun"}</button>
          </form>
        </Modal>
      )}
      {showOrderForm && v && <OrderFormModal o={editOrder} customerId={v.id} customerName={v.name} packages={packages} back={back} />}
      {showInvoiceForm && v && <InvoiceFormModal inv={editInvoice} customerId={v.id} customerName={v.name} orders={vOrders} invoices={vInvoices} presetOrderId={presetOrder} internalNote={editInvoice ? notes[editInvoice.id] ?? "" : ""} back={back} />}
      {v && !c && !showOrderForm && !showInvoiceForm && (
        <Modal title={v.name} close="/admin/customers" wide>
          <div className="detail-section">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--line)] p-3"><p className="text-xs text-[var(--ink-3)]">Total sudah dibayar</p><p className="num text-lg font-bold text-[var(--ok,var(--ink))]">{fmtIDR(paidTotal)}</p></div>
              <div className="rounded-lg border border-[var(--line)] p-3"><p className="text-xs text-[var(--ink-3)]">Tagihan saat ini</p><p className={`num text-lg font-bold ${openTotal > 0 ? "text-[var(--warn)]" : ""}`}>{openTotal > 0 ? fmtIDR(openTotal) : "Rp 0"}</p></div>
            </div>
            <details className="group mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--ink-3)] hover:text-[var(--brand-ink)]">Detail pelanggan <span className="font-normal">· {v.email}</span></summary>
              <div className="mt-3">
            <div className="mb-4 flex flex-wrap items-center gap-2">{v.isActive ? <Badge tone="emerald">aktif</Badge> : <Badge>nonaktif</Badge>}{v.company && <span className="text-sm text-[var(--ink-2)]">{v.company}</span>}</div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Email">{v.email}</Info>
              <Info label="WhatsApp">{v.phone || "—"}</Info>
              <Info label="Alamat" wide>{v.address || "—"}</Info>
              {v.notes && <Info label="Catatan internal" wide><span className="whitespace-pre-line">{v.notes}</span></Info>}
              <Info label="Login terakhir">{fmtDateTime(v.lastLoginAt)}</Info>
              <Info label="Tagihan terbuka">{v.unpaidCount ? <span className="num font-bold">{fmtIDR(v.unpaidTotal)}</span> : "Tidak ada"}</Info>
            </dl>
              </div>
            </details>
          </div>

          <div className="detail-section">
            <CustomerServices orders={vOrders} invoices={vInvoices} ctx={ctx} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            {can(user, "customer.update") && <Link href={`/admin/customers?edit=${v.id}`} scroll={false} className="btn-primary btn-sm">Edit data pelanggan</Link>}
            {can(user, "order.create") && <Link href={`${back}&order=new`} scroll={false} className="btn-ghost btn-sm">+ Layanan</Link>}
            {can(user, "invoice.create") && <Link href={`${back}&inv=new`} scroll={false} className="btn-gold btn-sm">+ Tagihan manual</Link>}
          </div>
        </Modal>
      )}

      <List count={rows.length} label="pelanggan">
        {rows.map((r, k) => (
          <RowLink key={r.id} no={k + 1} href={`/admin/customers?view=${r.id}`} dim={!r.isActive}
            right={<span className="hidden text-right sm:block">{r.unpaidCount ? <><span className="num block text-sm font-bold text-[var(--ink)]">{fmtIDR(r.unpaidTotal)}</span><span className="text-xs text-[var(--warn)]">{r.unpaidCount} tagihan terbuka</span></> : <Badge tone="emerald">lunas</Badge>}</span>}>
            <span className="block truncate font-semibold text-[var(--ink)]">{r.name}{r.company && <span className="font-normal text-[var(--ink-3)]"> · {r.company}</span>}</span>
            <span className="mt-0.5 block truncate text-xs text-[var(--ink-3)]">{r.orderCount} layanan · {r.email}{nextDue.get(r.id) && <> · jatuh tempo {fmtDate(nextDue.get(r.id)!)} <span className={daysUntil(nextDue.get(r.id)!) < 0 ? "text-[var(--bad)]" : daysUntil(nextDue.get(r.id)!) <= 7 ? "text-[var(--warn)]" : ""}>({daysText(daysUntil(nextDue.get(r.id)!))})</span></>}<span className="sm:hidden">{r.unpaidCount ? ` · ${fmtIDR(r.unpaidTotal)} terbuka` : " · lunas"}</span></span>
          </RowLink>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-[var(--ink-3)]">Belum ada pelanggan.</li>}
      </List>
    </>
  );
}
