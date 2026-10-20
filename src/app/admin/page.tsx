import Link from "next/link";
import { sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { Card, PageTitle } from "@/shared/ui";
import { requireUser } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { certifications, experiences, projects, skills } from "@/modules/content/schema";
import { users } from "@/modules/users/schema";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser(); // dashboard hanya butuh login → tidak ada loop redirect
  const { denied } = await searchParams;

  // 1 query untuk semua hitungan
  const [c] = await db().execute<{ exp: number; cert: number; skill: number; project: number; published: number; user: number }>(sql`
    select (select count(*) from ${experiences})::int as exp,
           (select count(*) from ${certifications})::int as cert,
           (select count(*) from ${skills})::int as skill,
           (select count(*) from ${projects})::int as project,
           (select count(*) from ${projects} where is_published)::int as published,
           (select count(*) from ${users})::int as "user"`);

  const stats: [string, number, string, string][] = [
    ["Pengalaman", c?.exp ?? 0, "/admin/experience", "experience.read"],
    ["Sertifikasi", c?.cert ?? 0, "/admin/certification", "certification.read"],
    ["Skill", c?.skill ?? 0, "/admin/skill", "skill.read"],
    ["Project", c?.project ?? 0, "/admin/projects", "project.read"],
    ["Project tayang", c?.published ?? 0, "/admin/projects", "project.read"],
    ["Pengguna", c?.user ?? 0, "/admin/users", "user.read"],
  ];

  return (
    <>
      <PageTitle sub={`Login sebagai ${user.email}`}>Dashboard</PageTitle>
      {denied && <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Akses ditolak: butuh permission <code>{denied}</code>.</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.filter(([, , , perm]) => can(user, perm)).map(([label, n, href]) => (
          <Link key={label} href={href} className="glass rounded-2xl p-5 transition hover:border-violet-400/40">
            <p className="text-[11px] uppercase tracking-wider text-violet-300">{label}</p>
            <p className="font-display mt-1 text-4xl font-extrabold text-gradient">{n}</p>
          </Link>
        ))}
      </div>
      <Card title="Tips" className="mt-6">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-400">
          <li>Section di halaman publik mengikuti menu <b>PUBLIC</b> yang aktif (menu → Menu Dinamis).</li>
          <li>Perubahan konten langsung memperbarui halaman publik (cache dibatalkan otomatis).</li>
          <li>Sidebar hanya menampilkan menu yang hak aksesnya Anda miliki ({user.isSuper ? "akses penuh" : `${user.permissions.length} permission`}).</li>
        </ul>
      </Card>
    </>
  );
}
