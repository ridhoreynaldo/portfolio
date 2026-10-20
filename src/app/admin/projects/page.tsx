import Link from "next/link";
import { Badge, Card, PageTitle, Table, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteProjectAction, saveProjectAction } from "@/modules/content/actions";
import { listProjects } from "@/modules/content/repository";

function Input({ name, label, value, type = "text", required, placeholder, hint }: { name: string; label: string; value?: string | number | null; type?: string; required?: boolean; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}{required && " *"}</label>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} required={required} placeholder={placeholder} className="input-dark" />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const user = await requirePermissionPage("project.read");
  const { edit } = await searchParams;
  const rows = await listProjects();
  const p = edit ? rows.find((r) => r.id === edit) : undefined;
  const canWrite = can(user, `project.${p ? "update" : "create"}`);

  return (
    <>
      <PageTitle sub={`${rows.length} project · ${rows.filter((r) => r.isPublished).length} tayang`}>Project</PageTitle>
      {canWrite && (
        <Card title={p ? `Edit: ${p.title}` : "Tambah project"} right={p && <Link href="/admin/projects" className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveProjectAction} className="space-y-4" key={p?.id ?? "new"}>
            {p && <input type="hidden" name="id" value={p.id} />}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="title" label="Judul" value={p?.title} required />
              <Input name="slug" label="Slug" value={p?.slug} placeholder="otomatis dari judul" />
              <div className="sm:col-span-2">
                <label className="label" htmlFor="description">Ringkasan *</label>
                <textarea id="description" name="description" rows={2} required defaultValue={p?.description} className="input-dark" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="detailDescription">Deskripsi detail (modal)</label>
                <textarea id="detailDescription" name="detailDescription" rows={5} defaultValue={p?.detailDescription ?? ""} className="input-dark" />
              </div>
              <Input name="role" label="Peran" value={p?.role} placeholder="Lead Developer" />
              <Input name="year" label="Tahun" value={p?.year} type="number" />
              <Input name="tags" label="Tag (pisah koma)" value={p?.tags.join(", ")} placeholder="Next.js, PostgreSQL" />
              <Input name="techStack" label="Tech stack (pisah koma)" value={p?.techStack.join(", ")} placeholder="Next.js, Drizzle, Docker" />
              <div className="sm:col-span-2">
                <label className="label" htmlFor="tagIcons">Ikon kustom per tag (satu per baris: <code>Tag=https://…/icon.svg</code>)</label>
                <textarea id="tagIcons" name="tagIcons" rows={2} defaultValue={Object.entries(p?.tagIcons ?? {}).map(([k, v]) => `${k}=${v}`).join("\n")} className="input-dark font-mono text-xs" />
              </div>
              <Input name="imageUrl" label="URL gambar" value={p?.imageUrl} type="url" />
              <Input name="demoUrl" label="URL demo" value={p?.demoUrl} type="url" />
              <Input name="repoUrl" label="URL repo" value={p?.repoUrl} type="url" />
              <Input name="sortOrder" label="Urutan" value={p?.sortOrder ?? 0} type="number" />
              <Input name="totalUsers" label="Total pengguna (teks)" value={p?.totalUsers} placeholder="12.000+" />
              <Input name="concurrentUsers" label="Pengguna bersamaan (teks)" value={p?.concurrentUsers} placeholder="500" />
              <label className="flex items-center gap-2 pt-6 text-sm text-slate-300"><input type="checkbox" name="isFeatured" defaultChecked={p?.isFeatured ?? false} className="accent-violet-500" /> Unggulan</label>
              <label className="flex items-center gap-2 pt-6 text-sm text-slate-300"><input type="checkbox" name="isPublished" defaultChecked={p?.isPublished ?? true} className="accent-violet-500" /> Tayang di halaman publik</label>
            </div>
            <button className="btn-primary">{p ? "Simpan perubahan" : "Tambah"}</button>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr><th className={th}>Judul</th><th className={th}>Tahun</th><th className={th}>Tag</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className={td}><div className="font-medium text-white">{r.title}</div><div className="text-xs text-slate-500">/{r.slug}</div></td>
                <td className={td}>{r.year ?? "—"}</td>
                <td className={td}><div className="flex flex-wrap gap-1">{r.tags.slice(0, 4).map((t) => <Badge key={t} tone="cyan">{t}</Badge>)}</div></td>
                <td className={td}><div className="flex gap-1">{r.isPublished ? <Badge tone="emerald">tayang</Badge> : <Badge>draft</Badge>}{r.isFeatured && <Badge tone="violet">unggulan</Badge>}</div></td>
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, "project.update") && <Link href={`/admin/projects?edit=${r.id}`} className="btn-ghost btn-sm">Edit</Link>}
                    {can(user, "project.delete") && <form action={deleteProjectAction}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={5}>Belum ada project.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
