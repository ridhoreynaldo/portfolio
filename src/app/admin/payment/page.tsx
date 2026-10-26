import { Card, PageTitle } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { savePaymentSettingsAction } from "@/modules/billing/actions";
import { getPaymentSettings } from "@/modules/billing/repository";

export default async function PaymentPage() {
  const user = await requirePermissionPage("payment.read");
  const s = await getPaymentSettings();
  const canEdit = can(user, "payment.update");
  return (
    <>
      <PageTitle sub="QRIS dan rekening yang ditampilkan ke pelanggan di halaman tagihan. Unggah gambar QRIS statis Anda (PNG/JPG).">Pembayaran & QRIS</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Pengaturan">
          <form action={savePaymentSettingsAction} className="space-y-4" encType="multipart/form-data">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Gambar QRIS (PNG / JPG / WebP, maks 3 MB)</label>
                <input name="qris" type="file" accept="image/png,image/jpeg,image/webp" disabled={!canEdit} className="input-dark" />
                {s?.qrisFileId && <label className="mt-2 flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" name="removeQris" className="accent-cyan-400" disabled={!canEdit} /> hapus QRIS yang ada</label>}
              </div>
              <div><label className="label">Bank</label><input name="bankName" maxLength={64} defaultValue={s?.bankName} placeholder="BCA / Mandiri / …" disabled={!canEdit} className="input-dark" /></div>
              <div><label className="label">Nomor rekening</label><input name="bankAccount" maxLength={64} defaultValue={s?.bankAccount} disabled={!canEdit} className="input-dark" /></div>
              <div><label className="label">Atas nama</label><input name="bankHolder" maxLength={128} defaultValue={s?.bankHolder} disabled={!canEdit} className="input-dark" /></div>
              <div><label className="label">WhatsApp konfirmasi (kosong = telepon profil)</label><input name="confirmPhone" maxLength={64} defaultValue={s?.confirmPhone} placeholder="08xxxxxxxxxx" disabled={!canEdit} className="input-dark" /></div>
              <div className="sm:col-span-2"><label className="label">Instruksi tambahan</label><textarea name="instructions" rows={3} maxLength={4000} defaultValue={s?.instructions} placeholder="Contoh: setelah transfer, unggah bukti di halaman tagihan. Verifikasi maks 1×24 jam." disabled={!canEdit} className="input-dark" /></div>
            </div>
            {canEdit && <button className="btn-primary">Simpan</button>}
          </form>
        </Card>
        <Card title="Pratinjau QRIS">
          {s?.qrisFileId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="bg-white p-3"><img src={`/api/files/${s.qrisFileId}`} alt="QRIS" className="mx-auto w-full" /></div>
          ) : (
            <p className="text-sm text-slate-400">Belum ada QRIS. Unggah di formulir.</p>
          )}
        </Card>
      </div>
    </>
  );
}
