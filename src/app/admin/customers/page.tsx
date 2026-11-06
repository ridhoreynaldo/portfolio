import Link from "next/link";
import { Modal } from "@/components/lc/modal";
import { Badge, Info, List, PageTitle, RowLink, fmtDate, fmtDateTime } from "@/components/lc/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { saveCustomerAction } from "@/modules/billing/actions";
import { fmtIDR } from "@/modules/billing/labels";
import { CustomerServices } from "@/components/lc/service-list";
import { listCustomers, listInvoices, listOrders } from "@/modules/billing/repository";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string; view?: string }> }) {
  const user = await requirePermissionPage("customer.read");
  const { edit, new: isNew, view } = await searchParams;
  const rows = await listCustomers();
  const c = edit ? rows.find((r) => r.id === edit) : undefined;
  const v = view ? rows.find((r) => r.id === view) : undefined;
  const [vOrders, vInvoices] = v ? await Promise.all([listOrders({ userId: v.id }), listInvoices({ userId: v.id })]) : [[], []];
  const canWrite = can(user, `customer.${c ? "update" : "create"}`);

  return (
    <>
      <PageTitle actions={can(user, "customer.create") ? <Link href="/admin/customers?new=1" scroll={false} className="btn-primary btn-sm">+ Akun pelanggan</Link> : undefined} sub="Akun pelanggan (role customer). Pelanggan juga bisa mendaftar sendiri di /register. Hapus akun lewat menu Pengguna.">Pelanggan</PageTitle>
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
      {v && !c && (
        <Modal title={v.name} close="/admin/customers" wide>
          <div className="detail-section">
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

          <div className="detail-section">
            <CustomerServices orders={vOrders} invoices={vInvoices} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--line)] pt-4">
            {can(user, "customer.update") && <Link href={`/admin/customers?edit=${v.id}`} scroll={false} className="btn-primary btn-sm">Edit data</Link>}
            {can(user, "order.create") && <Link href="/admin/orders?new=1" className="btn-ghost btn-sm">+ Layanan</Link>}
            {can(user, "invoice.create") && <Link href={`/admin/invoices?new=1&userId=${v.id}`} className="btn-gold btn-sm">+ Tagihan</Link>}
          </div>
        </Modal>
      )}

      <List count={rows.length} label="pelanggan">
        {rows.map((r, k) => (
          <RowLink key={r.id} no={k + 1} href={`/admin/customers?view=${r.id}`} dim={!r.isActive}
            right={<span className="hidden text-right sm:block">{r.unpaidCount ? <><span className="num block text-sm font-bold text-[var(--ink)]">{fmtIDR(r.unpaidTotal)}</span><span className="text-xs text-[var(--warn)]">{r.unpaidCount} tagihan terbuka</span></> : <Badge tone="emerald">lunas</Badge>}</span>}>
            <span className="block truncate font-semibold text-[var(--ink)]">{r.name}{r.company && <span className="font-normal text-[var(--ink-3)]"> · {r.company}</span>}</span>
            <span className="mt-0.5 block truncate text-xs text-[var(--ink-3)]">{r.orderCount} layanan · {r.email}<span className="sm:hidden">{r.unpaidCount ? ` · ${fmtIDR(r.unpaidTotal)} terbuka` : " · lunas"}</span></span>
          </RowLink>
        ))}
        {!rows.length && <li className="px-4 py-8 text-center text-sm text-[var(--ink-3)]">Belum ada pelanggan.</li>}
      </List>
    </>
  );
}
