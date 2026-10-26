import Link from "next/link";
import { LogOut } from "lucide-react";
import { readFlash } from "@/shared/action";
import { Badge, Flash } from "@/shared/ui";
import { logoutAction } from "@/modules/auth/actions";
import { requireStaff } from "@/modules/auth/guards";
import { adminMenuTree } from "@/modules/menus/repository";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff(); // pelanggan (tanpa permission) → /portal
  const [tree, flash] = await Promise.all([adminMenuTree(user), readFlash()]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="glass flex shrink-0 flex-col border-x-0 border-t-0 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-9 w-9 rounded-xl" />
          <div className="min-w-0">
            <Link href="/" className="font-display block truncate text-sm font-bold text-gradient">Portfolio Admin</Link>
            <p className="truncate text-[11px] text-slate-500">{user.name}</p>
          </div>
        </div>
        <div className="flex-1">
          <Sidebar tree={tree.map((m) => ({ id: m.id, label: m.label, icon: m.icon, path: m.path, children: m.children.map((c) => ({ id: c.id, label: c.label, icon: c.icon, path: c.path })) }))} />
        </div>
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex flex-wrap gap-1">
            {user.roles.map((r) => <Badge key={r.id} tone={r.isSystem ? "violet" : "cyan"}>{r.name}</Badge>)}
          </div>
          <form action={logoutAction}>
            <button className="btn-ghost btn-sm w-full"><LogOut className="h-3.5 w-3.5" /> Keluar</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-10">
        <Flash flash={flash} />
        {children}
      </main>
    </div>
  );
}
