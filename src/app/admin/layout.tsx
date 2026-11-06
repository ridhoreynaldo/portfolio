import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { readFlash } from "@/shared/action";
import { logoutAction } from "@/modules/auth/actions";
import { requireStaff } from "@/modules/auth/guards";
import { adminMenuTree } from "@/modules/menus/repository";
import { AppShell, type NavGroup } from "@/components/lc/app-shell";
import { Flash } from "@/components/lc/ui";
import { SERVICE_LOGO } from "@/components/service-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

/** Panel admin: kerangka aplikasi Leetcloud (sidebar desktop, laci di HP). Menu dari tabel menu dinamis sesuai hak akses. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff(); // pelanggan (tanpa permission) → dashboard pelanggan
  const [tree, flash] = await Promise.all([adminMenuTree(user), readFlash()]);

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
      brand={{ name: "Admin Panel", sub: "Leetcloud · Portofolio", href: "/admin", logo: SERVICE_LOGO }}
      groups={groups}
      user={{ name: user.name, meta: user.roles.map((r) => r.name).join(", ") || user.email }}
      topActions={<Link href="https://leetcloud.my.id" className="btn-ghost btn-sm hidden sm:inline-flex" target="_blank"><ExternalLink className="h-3.5 w-3.5" /> Lihat situs</Link>}
      footer={
        <form action={logoutAction}>
          <button className="btn-ghost btn-sm w-full"><LogOut className="h-3.5 w-3.5" /> Keluar</button>
        </form>
      }
    >
      <Flash flash={flash} />
      {children}
    </AppShell>
  );
}
