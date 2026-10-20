import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldInputs, formatCell } from "@/components/field-inputs";
import { Card, PageTitle, Table, td, th } from "@/shared/ui";
import { requirePermissionPage } from "@/modules/auth/guards";
import { can } from "@/modules/auth/session";
import { deleteResourceAction, saveResourceAction } from "@/modules/content/actions";
import { listRows } from "@/modules/content/repository";
import { getResource } from "@/modules/content/resources";

/** CRUD generik untuk resource deklaratif (experience / certification / skill). */
export default async function ResourcePage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { resource } = await params;
  const res = getResource(resource);
  if (!res) notFound();
  const user = await requirePermissionPage(`${res.key}.read`);
  const { edit } = await searchParams;
  const rows = await listRows(res.key);
  const editing = edit ? rows.find((r) => r.id === edit) : undefined;
  const canWrite = can(user, `${res.key}.${editing ? "update" : "create"}`);
  const label = (name: string) => res.fields.find((f) => f.name === name)?.label ?? name;

  return (
    <>
      <PageTitle sub={`${rows.length} data`}>{res.title}</PageTitle>
      {canWrite && (
        <Card title={editing ? `Edit ${res.title}` : `Tambah ${res.title}`} right={editing && <Link href={`/admin/${res.key}`} className="btn-ghost btn-sm">Batal</Link>}>
          <form action={saveResourceAction.bind(null, res.key)} className="space-y-4" key={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <FieldInputs fields={res.fields} values={editing} />
            <button className="btn-primary">{editing ? "Simpan perubahan" : "Tambah"}</button>
          </form>
        </Card>
      )}
      <Card>
        <Table>
          <thead><tr>{res.columns.map((c) => <th key={c} className={th}>{label(c)}</th>)}<th className={th} /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                {res.columns.map((c) => <td key={c} className={td}>{formatCell(r[c])}</td>)}
                <td className={`${td} text-right`}>
                  <div className="flex justify-end gap-2">
                    {can(user, `${res.key}.update`) && <Link href={`/admin/${res.key}?edit=${r.id}`} className="btn-ghost btn-sm">Edit</Link>}
                    {can(user, `${res.key}.delete`) && (
                      <form action={deleteResourceAction.bind(null, res.key)}><input type="hidden" name="id" value={r.id} /><button className="btn-danger btn-sm">Hapus</button></form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className={td} colSpan={res.columns.length + 1}>Belum ada data.</td></tr>}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
