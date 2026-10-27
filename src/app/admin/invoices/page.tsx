import Link from "next/link";
import { Badge, Card, PageTitle, Table, fmtDate, fmtDateTime, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteInvoiceAction, generateMonthlyInvoicesAction, saveInvoiceAction, setInvoiceStatusAction } from "@/modules/billing/actions";
import { INVOICE_STATUS, currentPeriod, fmtIDR, fmtPeriod, isOverdue } from "@/modules/billing/labels";
import { customerOptions, listInvoices, listOrders } from "@/modules/billing/repository";

type Q = { edit?: string; new?: string; userId?: string; orderId?: string; title?: string; amount?: string; period?: string; status?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Q> }) {
  const user = await requirePermissionPage("invoice.read");
  const q = await searchParams;
  const [all, customers, orders] = await Promise.all([listInvoices(), customerOptions(), listOrders()]);
  const rows = q.status && q.status in INVOICE_STATUS ? all.filter((i) => i.status === q.status) : all;
  const inv = q.edit ? all.find((r) => r.id === q.edit) : undefined;
  const showForm = !!inv || q.new === "1";
  const canWrite = can(user, `invoice.${inv ? "update" : "create"}`);
  const due = new Date(); due.setDate(due.getDate() + 7);
  const preset = {
    userId: inv?.userId ?? q.userId ?? "",
    orderId: inv?.orderId ?? q.orderId ?? "",
    title: inv?.title ?? q.title ?? "",
    amount: inv?.amount ?? (q.amount ? Number(q.amount) : ""),
    period: inv?.period ?? q.period ?? "",
    dueDate: inv?.dueDate ?? due.toISOString().slice(0, 10),
    note: inv?.note ?? "",
    items: (inv?.items ?? []).map((i) => `${i.description} | ${i.amount}`).join("\n"),
    paidAt: inv?.paidAt ? new Date(inv.paidAt.getTime() + 7 * 3600_000).toISOString().slice(0, 10) : "",
  };
  const totals = { unpaid: all.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0), verifying: all.filter((i) => i.status === "pending_verification").length };

  return (
    <>
      <PageTitle sub="Tagihan pelanggan (sekali / bulanan). Pelanggan membayar via QRIS lalu mengunggah bukti; tandai Lunas setelah dicek.">Tagihan</PageTitle>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-lg p-4"><p className="hud-label !text-[10px]">belum dibayar</p><p className="font-display text-xl font-bold text-neon">{fmtIDR(totals.unpaid)}</p></div>
        <div className="glass rounded-lg p-4"><p className="hud-label !text-[10px]">menunggu verifikasi</p><p className="font-display text-xl font-bold text-white">{totals.verifying}</p></div>
        {can(user, "invoice.create") && (
          <form action={generateMonthlyInvoicesAction} className="glass flex flex-wrap items-end gap-2 rounded-lg p-4">
            <div><label className="label">Tagihan bulanan</label><input name="period" type="month" defaultValue={currentPeriod()} className="input-dark" /></div>
            <div><label className="label">Tgl jatuh tempo</label><input name="dueDay" type="number" min={1} max={28} defaultValue={15} className="input-dark w-20" /></div>
            <button className="btn-magenta btn-sm">Generate</button>
            <p className="w-full text-[11px] text-slate-500">Membuat tagihan untuk semua order <b>aktif</b> berpaket bulanan yang belum ditagih di periode itu. Jatuh tempo mengikuti tanggal mulai layanan tiap order (mis. tgl 15); isian di atas dipakai bila order tanpa tanggal mulai.</p>
          </form>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/invoices" className={`btn-ghost btn-sm ${!q.status ? "!border-cyan-400" : ""}`}>Semua ({all.length})</Link>
        {(Object.keys(INVOICE_STATUS) as (keyof typeof INVOICE_STATUS)[]).map((s) => (
          <Link key={s} href={`/admin/invoices?status=${s}`} className={`btn-ghost btn-sm ${q.status === s ? "!border-cyan-400" : ""}`}>{INVOICE_STATUS[s].label} ({all.filter((x) => x.status === s).length})</Link>
        ))}
        {!showForm && can(user, "invoice.create") && <Link href="/admin/invoices?new=1" className="btn-primary btn-sm ml-auto">+ Tagihan manual</Link>}
      </div>

      {showForm && canWrite && (
        <Card title={inv ? `Edit tagihan ${inv.number}` : "Tagihan baru"} right={<Link href="/admin/invoices" className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveInvoiceAction} className="space-y-4" key={inv?.id ?? "new"}>
            {inv && <input type="hidden" name="id" value={inv.id} />}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="sm:col-span-2"><label className="label">Judul tagihan *</label><input name="title" required minLength={2} maxLength={255} defaultValue={preset.title} placeholder="Sewa Server — Oktober 2026" className="input-dark" /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label className="label">Rincian baris (opsional, satu per baris: <code>deskripsi | nominal</code>; nominal tagihan otomatis = jumlahnya)</label><textarea name="items" rows={3} defaultValue={preset.items} className="input-dark font-mono text-xs" placeholder={"Sewa Server | 2000000\nMaintenance Aplikasi | 2500000"} /></div>
              <div><label className="label">Nominal (Rp){" "}<span className="text-slate-500">(diabaikan bila ada rincian)</span></label><input name="amount" type="number" min={0} step={1000} defaultValue={preset.amount} className="input-dark" /></div>
              <div><label className="label">Jatuh tempo *</label><input name="dueDate" type="date" required defaultValue={preset.dueDate} className="input-dark" /></div>
              <div><label className="label">Tanggal dibayar (isi = tandai lunas)</label><input name="paidAt" type="date" defaultValue={preset.paidAt} className="input-dark" /></div>
              <div className="sm:col-span-2 lg:col-span-3"><label className="label">Catatan (tampil ke pelanggan)</label><input name="note" maxLength={2000} defaultValue={preset.note} className="input-dark" /></div>
            </div>
            <button className="btn-primary">{inv ? "Simpan perubahan" : "Buat tagihan"}</button>
          </form>
        </Card>
      )}

      <Card>
        <Table>
          <thead><tr><th className={th}>Nomor</th><th className={th}>Pelanggan</th><th className={th}>Tagihan</th><th className={th}>Jatuh tempo</th><th className={th}>Nominal</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => {
              const late = isOverdue(r.dueDate, r.status);
              return (
                <tr key={r.id} className="align-top hover:bg-white/5">
                  <td className={`${td} font-mono text-xs text-cyan-300`}>{r.number}<div className="text-[10px] text-slate-500">{fmtDateTime(r.createdAt)}</div></td>
                  <td className={td}><div className="text-white">{r.customerName}</div><div className="text-xs text-slate-500">{r.customerEmail}</div></td>
                  <td className={td}>{r.title}{r.period && <div className="text-xs text-slate-500">{fmtPeriod(r.period)}</div>}
                    {r.items.length > 0 && <ul className="mt-1 space-y-0.5 text-xs text-slate-400">{r.items.map((i, k) => <li key={k}>· {i.description} <span className="text-slate-500">{fmtIDR(i.amount)}</span></li>)}</ul>}
                  </td>
                  <td className={`${td} ${late ? "text-rose-300" : ""}`}>{fmtDate(r.dueDate)}{late && <div className="text-[10px]">lewat</div>}</td>
                  <td className={`${td} font-semibold text-white`}>{fmtIDR(r.amount)}</td>
                  <td className={td}>
                    <Badge tone={INVOICE_STATUS[r.status].tone}>{INVOICE_STATUS[r.status].label}</Badge>
                    {r.proofFileId && <div className="mt-1 text-xs"><a href={`/api/files/${r.proofFileId}`} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">bukti bayar ↗</a>{r.proofUploadedAt && <span className="text-slate-500"> · {fmtDateTime(r.proofUploadedAt)}</span>}</div>}
                    {r.paidAt && <div className="text-[10px] text-emerald-300">lunas {fmtDateTime(r.paidAt)}</div>}
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {can(user, "invoice.update") && r.status !== "paid" && r.status !== "cancelled" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="paid" /><button className="btn-primary btn-sm">Lunas</button></form>
                      )}
                      {can(user, "invoice.update") && r.status === "paid" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="unpaid" /><button className="btn-ghost btn-sm">Batal lunas</button></form>
                      )}
                      {can(user, "invoice.update") && r.status === "unpaid" && (
                        <form action={setInvoiceStatusAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="cancelled" /><button className="btn-ghost btn-sm">Batalkan</button></form>
                      )}
                      <a href={`/jasa/invoice/${r.id}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm">Cetak</a>
                      {can(user, "invoice.update") && <Link href={`/admin/invoices?edit=${r.id}`} className="btn-ghost btn-sm">Edit</Link>}
                      {can(user, "invoice.delete") && <form action={deleteInvoiceAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td className={td} colSpan={7}>Belum ada tagihan.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
