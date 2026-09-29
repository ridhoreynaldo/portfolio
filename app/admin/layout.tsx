import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMenuTree } from "@/lib/menus";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const tree = await getMenuTree(session.sub, session.roles);

  return (
    <div className="flex min-h-screen">
      <Sidebar tree={tree} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} />
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
