import { count, desc } from "drizzle-orm";
import { db } from "@/db";
import { menus, projects, roles, users } from "@/db/schema";
import StatCard from "@/components/StatCard";
import { FolderKanban, ListTree, ShieldCheck, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [[u], [p], [m], [r]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(projects),
    db.select({ n: count() }).from(menus),
    db.select({ n: count() }).from(roles),
  ]);

  const recentProjects = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt))
    .limit(5);
  const recentUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Pengguna" value={u.n} accent="text-cyan-300" />
        <StatCard icon={FolderKanban} label="Proyek" value={p.n} accent="text-violet-300" />
        <StatCard icon={ListTree} label="Menu" value={m.n} accent="text-fuchsia-300" />
        <StatCard icon={ShieldCheck} label="Peran" value={r.n} accent="text-emerald-300" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display mb-4 text-lg font-bold text-white">
            Proyek Terbaru
          </h3>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada proyek.</p>
          ) : (
            <ul className="space-y-3">
              {recentProjects.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                >
                  <span className="font-medium text-slate-200">{pr.title}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      pr.isPublished
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-slate-400/10 text-slate-400"
                    }`}
                  >
                    {pr.isPublished ? "Terbit" : "Draf"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display mb-4 text-lg font-bold text-white">
            Pengguna Terbaru
          </h3>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada pengguna.</p>
          ) : (
            <ul className="space-y-3">
              {recentUsers.map((usr) => (
                <li
                  key={usr.id}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                >
                  <div>
                    <div className="font-medium text-slate-200">{usr.name}</div>
                    <div className="text-xs text-slate-500">{usr.email}</div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      usr.isActive
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {usr.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
