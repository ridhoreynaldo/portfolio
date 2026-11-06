import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { readFlash } from "@/shared/action";
import { logoutAction } from "@/modules/auth/actions";
import { requireStaff } from "@/modules/auth/guards";
import { adminMenuTree } from "@/modules/menus/repository";
import { AppShell, type NavGroup } from "@/components/lc/app-shell";
import { Wordmark } from "@/components/lc/wordmark";
import { Toast } from "@/components/lc/modal";
import { SERVICE_LOGO } from "@/components/service-shell";
import { SITE_URL, adminSiteOf, currentSite } from "@/shared/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

/**
 * Panel admin, DIPISAH per situs: leetcloud.my.id/admin = jasa (paket, layanan, tagihan, pelanggan, pembayaran),
 * ridhoreynaldo.com/admin = konten portofolio & master data. Menu dari tabel menu dinamis, disaring hak akses + situs.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff(); // pelanggan (tanpa permission) → dashboard pelanggan
  const [all, flash, site] = await Promise.all([adminMenuTree(user), readFlash(), currentSite()]);
  const mine = (path: string) => { const s = adminSiteOf(path); return s === null || s === site; };
  const tree = all
    .map((m) => ({ ...m, children: m.children.filter((c) => mine(c.path)) }))
    .filter((m) => (m.path === "#" ? m.children.length > 0 : mine(m.path)));
  const other = site === "leet" ? "portfolio" : "leet";

  // menu "#" = judul grup; menu biasa beserta anaknya masuk grup tanpa judul
  const groups: NavGroup[] = [];
  let loose: NavGroup | null = null;
  for (const m of tree) {
    const kids = m.children.map((c) => ({ label: c.label, href: c.path, icon: c.icon }));
    if (m.path === "#") {
      loose = null;
      groups.push({ label: m.label, items: kids });
    } else {
      if (!loose) groups.push((loose = { items: [] }));
      loose.items.push({ label: m.label, href: m.path, icon: m.icon }, ...kids);
    }
  }

  return (
    <AppShell
      brand={site === "leet"
        ? { name: <Wordmark />, sub: "Admin jasa", href: "/admin", logo: SERVICE_LOGO }
        : { name: <span className="font-cyber cosmic-text font-bold tracking-wider">Portofolio</span>, sub: "Admin ridhoreynaldo.com", href: "/admin", logo: "/logo.png" }}
      groups={groups}
      user={{ name: user.name, meta: user.roles.map((r) => r.name).join(", ") || user.email }}
      topActions={<>
        <Link href={`${SITE_URL[other]}/admin`} className="btn-ghost btn-sm hidden md:inline-flex">{other === "leet" ? "Panel 1337cloud" : "Panel portofolio"}</Link>
        <Link href={site === "leet" ? SITE_URL.leet : SITE_URL.portfolio} className="btn-ghost btn-sm hidden sm:inline-flex" target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Lihat situs</Link>
      </>}
      footer={
        <form action={logoutAction}>
          <button className="btn-ghost btn-sm w-full"><LogOut className="h-3.5 w-3.5" /> Keluar</button>
        </form>
      }
    >
      <Toast flash={flash} />
      {children}
    </AppShell>
  );
}
