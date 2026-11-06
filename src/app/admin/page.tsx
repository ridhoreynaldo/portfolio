import { sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { Card, PageHeader, Stat } from "@/components/lc/ui";
import { requireStaff } from "@/modules/auth/guards";
import { currentSite } from "@/shared/site";
import { can } from "@/modules/auth/session";
import { certifications, experiences, projects, skills } from "@/modules/content/schema";
import { users } from "@/modules/users/schema";
import { billingStats } from "@/modules/billing/repository";
import { fmtIDR } from "@/modules/billing/labels";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireStaff(); // dashboard hanya butuh login staf → tidak ada loop redirect
  const { denied } = await searchParams;
  const site = await currentSite();

  // 1 query untuk semua hitungan
  const [c] = await db().execute<{ exp: number; cert: number; skill: number; project: number; published: number; user: number }>(sql`
    select (select count(*) from ${experiences})::int as exp,
           (select count(*) from ${certifications})::int as cert,
           (select count(*) from ${skills})::int as skill,
           (select count(*) from ${projects})::int as project,
           (select count(*) from ${projects} where is_published)::int as published,
           (select count(*) from ${users})::int as "user"`);
  const b = await billingStats();

  const stats: [string, number, string, string][] = [
    ["Pengalaman", c?.exp ?? 0, "/admin/experience", "experience.read"],
    ["Sertifikasi", c?.cert ?? 0, "/admin/certification", "certification.read"],
    ["Skill", c?.skill ?? 0, "/admin/skill", "skill.read"],
    ["Project", c?.project ?? 0, "/admin/projects", "project.read"],
    ["Project tayang", c?.published ?? 0, "/admin/projects", "project.read"],
    ["Pengguna", c?.user ?? 0, "/admin/users", "user.read"],
  ];
  const billing: [string, string, string, string][] = [
    ["Pesanan menunggu konfirmasi", String(b.pendingOrders), "/admin/orders?status=pending", "order.read"],
    ["Layanan aktif", String(b.activeOrders), "/admin/orders?status=active", "order.read"],
    ["Tagihan belum dibayar", fmtIDR(b.unpaidTotal), "/admin/invoices?status=open", "invoice.read"],
    ["Bukti bayar perlu verifikasi", String(b.verifying), "/admin/invoices?status=verify", "invoice.read"],
    ["Total lunas", fmtIDR(b.paidTotal), "/admin/invoices?status=paid", "invoice.read"],
  ];

  // tiap situs hanya menampilkan statistiknya sendiri
  const shownBilling = site === "leet" ? billing.filter(([, , , perm]) => can(user, perm)) : [];
  const shownStats = site === "portfolio" ? stats.filter(([, , , perm]) => can(user, perm)) : [];

  return (
    <>
      <PageHeader eyebrow={`Halo, ${user.name}`} title={site === "leet" ? "Dashboard jasa" : "Dashboard portofolio"} sub={`Login sebagai ${user.email}`} />
      {denied && <div className="alert-warn mb-4 px-4 py-3 text-sm">Akses ditolak: butuh permission <code>{denied}</code>.</div>}

      {shownBilling.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink-2)]">Layanan & pembayaran</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            {shownBilling.map(([label, n, href]) => <Stat key={label} label={label} value={n} href={href} />)}
          </div>
        </section>
      )}

      {shownStats.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-[var(--ink-2)]">Konten portofolio</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            {shownStats.map(([label, n, href]) => <Stat key={label} label={label} value={n} href={href} />)}
          </div>
        </section>
      )}

      {site === "leet" ? (
        <Card title="Alur kerja layanan">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[var(--ink-2)]">
            <li>Pelanggan memesan paket di <b>leetcloud.my.id</b> (atau Anda buat <b>layanan manual</b>).</li>
            <li>Ubah status layanan menjadi <b>Aktif</b>, lalu buat tagihan (atau <b>Generate</b> tagihan bulanan).</li>
            <li>Pelanggan membayar via QRIS dan mengunggah bukti di dashboard.</li>
            <li>Verifikasi bukti, lalu tandai tagihan <b>Lunas</b>.</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--ink-3)]">Konten portofolio dikelola terpisah di <a href="https://ridhoreynaldo.com/admin" className="text-[var(--brand-ink)] hover:underline">ridhoreynaldo.com/admin</a>.</p>
        </Card>
      ) : (
        <Card title="Panel portofolio">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-[var(--ink-2)]">
            <li>Section di halaman portofolio mengikuti menu <b>PUBLIC</b> yang aktif (Master Data → Menu Dinamis).</li>
            <li>Perubahan konten langsung memperbarui halaman publik.</li>
            <li>Jasa, layanan, tagihan, dan pelanggan dikelola terpisah di <a href="https://leetcloud.my.id/admin" className="text-[var(--brand-ink)] hover:underline">leetcloud.my.id/admin</a>.</li>
          </ul>
          <p className="mt-4 text-xs text-[var(--ink-3)]">Sidebar hanya menampilkan menu yang hak aksesnya Anda miliki ({user.isSuper ? "akses penuh" : `${user.permissions.length} permission`}).</p>
        </Card>
      )}
    </>
  );
}
