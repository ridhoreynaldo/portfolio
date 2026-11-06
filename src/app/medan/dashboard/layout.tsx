import Link from "next/link";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { AppShell, type NavItem } from "@/components/lc/app-shell";
import { Flash } from "@/components/lc/ui";
import { SERVICE_LOGO, SERVICE_BRAND } from "@/components/service-shell";
import { logoutToHomeAction } from "@/modules/auth/actions";
import { requireUser } from "@/modules/auth/guards";
import { isStaff } from "@/modules/auth/session";
import { readFlash } from "@/shared/action";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard Pelanggan" };

const NAV: NavItem[] = [
  { label: "Ringkasan", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Tagihan", href: "/dashboard/tagihan", icon: "Receipt" },
  { label: "Akun", href: "/dashboard/akun", icon: "UserRound" },
];

/** Dashboard pelanggan Leetcloud: langganan, tagihan, pembayaran. Staf juga bisa membuka untuk uji coba. */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const flash = await readFlash();
  const brand = SERVICE_BRAND;
  return (
    <AppShell
      brand={{ name: brand.name, sub: "Dashboard pelanggan", href: "/dashboard", logo: SERVICE_LOGO }}
      groups={[
        { items: NAV },
        { label: "Layanan", items: [{ label: "Pesan layanan baru", href: "/#paket", icon: "Package" }, { label: "Halaman Leetcloud", href: "/", icon: "Home" }] },
      ]}
      tabs={NAV}
      user={{ name: user.name, meta: user.email }}
      topActions={
        <>
          {isStaff(user) && <Link href="/admin" className="btn-ghost btn-sm hidden sm:inline-flex"><LayoutDashboard className="h-3.5 w-3.5" /> Admin</Link>}
          <Link href="/#paket" className="btn-primary btn-sm"><Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Pesan layanan</span><span className="sm:hidden">Pesan</span></Link>
        </>
      }
      footer={<form action={logoutToHomeAction}><button className="btn-ghost btn-sm w-full"><LogOut className="h-3.5 w-3.5" /> Keluar</button></form>}
    >
      <Flash flash={flash} />
      {children}
    </AppShell>
  );
}
