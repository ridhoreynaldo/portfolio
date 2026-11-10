import Link from "next/link";
import { MoneyInput } from "@/components/lc/money-input";
import { Modal } from "@/components/lc/modal";
import { Badge, Card, PageTitle, Table, td, th } from "@/components/lc/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deletePackageAction, savePackageAction } from "@/modules/billing/actions";
import { CYCLE, PACKAGE_CATEGORIES, fmtIDR, tierRange } from "@/modules/billing/labels";
import { listPackages } from "@/modules/billing/repository";
import { billingCycle } from "@/modules/billing/schema";

export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const user = await requirePermissionPage("package.read");
  const { edit, new: isNew } = await searchParams;
  const rows = await listPackages();
  const p = edit ? rows.find((r) => r.id === edit) : undefined;
  const canWrite = can(user, `package.${p ? "update" : "create"}`);

  return (
    <>
      <PageTitle actions={can(user, "package.create") ? <Link href="/admin/packages?new=1" scroll={false} className="btn-primary btn-sm">+ Tambah paket</Link> : undefined} sub="Katalog jasa yang tampil di leetcloud.my.id dan halaman detail paket. Harga 0 = “Hubungi”. Harga bertingkat (bila diisi) tampil sebagai tabel estimasi; harga pasti tetap lewat WhatsApp.">Paket Layanan</PageTitle>
      {canWrite && (p || isNew === "1") && (
        <Modal title={p ? `Edit: ${p.name}` : "Tambah paket"} close="/admin/packages">
          <form action={savePackageAction} className="space-y-4" key={p?.id ?? "new"}>
            {p && <input type="hidden" name="id" value={p.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Nama *</label><input name="name" required minLength={2} defaultValue={p?.name} className="input-dark" /></div>
              <div><label className="label">Slug</label><input name="slug" defaultValue={p?.slug} placeholder="otomatis dari nama" className="input-dark" /></div>
              <div>
                <label className="label">Kategori *</label>
                <select name="category" defaultValue={p?.category ?? "Pembuatan Aplikasi"} className="input-dark">{PACKAGE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
              <div><label className="label">Harga (Rp)</label><MoneyInput name="price" defaultValue={p?.price ?? 0} /></div>
              <div>
                <label className="label">Siklus tagihan *</label>
                <select name="billingCycle" defaultValue={p?.billingCycle ?? "once"} className="input-dark">{billingCycle.enumValues.map((c) => <option key={c} value={c}>{CYCLE[c]}</option>)}</select>
              </div>
              <div><label className="label">Satuan (untuk jumlah)</label><input name="unit" maxLength={32} defaultValue={p?.unit} placeholder="bulan / nomor / sesi (kosong = 1 unit)" className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Deskripsi</label><textarea name="description" rows={2} maxLength={2000} defaultValue={p?.description} className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Fitur (satu per baris)</label><textarea name="features" rows={4} defaultValue={p?.features.join("\n")} className="input-dark" /></div>
              <div className="sm:col-span-2">
                <label className="label">Harga bertingkat (opsional, satu per baris: <code>label | harga</code>)</label>
                <textarea name="priceTiers" rows={5} defaultValue={p?.priceTiers.map((t) => `${t.label} | ${new Intl.NumberFormat("id-ID").format(t.price)}`).join("\n")} placeholder={"≤ 100 pengguna | 350.000\n≤ 5.000 pengguna | 2.500.000\n> 5.000 pengguna | 0"} className="input-dark font-mono text-xs" />
                <p className="mt-1 text-xs text-[var(--ink-3)]">Harga 0 pada satu tingkat berarti “hubungi”. Kolom Harga (Rp) di atas tetap dipakai sebagai harga dasar tagihan otomatis.</p>
              </div>
              <div><label className="label">Urutan</label><input name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} className="input-dark" /></div>
              <label className="flex items-center gap-2 pt-6 text-sm text-[var(--ink-2)]"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} className="accent-cyan-400" /> Aktif (tampil & bisa dipesan)</label>
              <label className="flex items-center gap-2 pt-6 text-sm text-[var(--ink-2)]"><input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured ?? false} className="accent-cyan-400" /> Unggulan</label>
            </div>
            <button className="btn-primary">{p ? "Simpan perubahan" : "Tambah"}</button>
          </form>
        </Modal>
      )}
      <Card flush>
        <Table>
          <thead><tr><th className={th}>Paket</th><th className={th}>Kategori</th><th className={th}>Harga</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`hover:bg-[var(--surface-2)] ${r.isActive ? "" : "opacity-50"}`}>
                <td className={td}><div className="font-medium text-[var(--ink)]">{r.name}</div><div className="text-xs text-[var(--ink-3)]">/order/{r.slug}</div></td>
                <td className={td}>{r.category}</td>
                <td className={td}>
                  {r.priceTiers.length > 0 ? tierRange(r.priceTiers) : r.price > 0 ? fmtIDR(r.price) : "Hubungi"}
                  <div className="text-xs text-[var(--ink-3)]">{CYCLE[r.billingCycle]}{r.unit && ` / ${r.unit}`}{r.priceTiers.length > 0 && ` · ${r.priceTiers.length} tingkat`}</div>
                </td>
                <td className={td}><div className="flex gap-1">{r.isActive ? <Badge tone="emerald">aktif</Badge> : <Badge>nonaktif</Badge>}{r.isFeatured && <Badge tone="violet">unggulan</Badge>}</div></td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, "package.update") && <Link href={`/admin/packages?edit=${r.id}`} scroll={false} className="btn-ghost btn-sm">Edit</Link>}
                    {can(user, "package.delete") && <form action={deletePackageAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={5}>Belum ada paket.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
