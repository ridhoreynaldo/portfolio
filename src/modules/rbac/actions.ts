"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { action, setFlash } from "@/shared/action";
import { AppError, notFound } from "@/shared/errors";
import { requirePermission } from "@/modules/auth/guards";
import { PERMISSION_KEYS } from "./permissions";
import { countRoleUsers, deleteRole, getRole, saveRole } from "./repository";

const input = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,63}$/, "Nama role: huruf kecil/angka/underscore, mis. content_editor"),
  description: z.string().trim().max(255).default(""),
});

export const saveRoleAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  const me = await requirePermission(`role.${id ? "update" : "create"}`);
  const data = input.parse({ id, name: form.get("name"), description: form.get("description") });
  const requested = form.getAll("permissions").map(String).filter((k) => PERMISSION_KEYS.has(k));

  const existing = id ? await getRole(id) : undefined;
  if (id && !existing) throw notFound();

  // Anti eskalasi hak: hanya super admin yang boleh menyentuh role sistem atau role miliknya sendiri,
  // dan non-super tidak bisa memberi permission yang tidak ia pegang.
  if (!me.isSuper) {
    if (existing?.isSystem) throw new AppError("Role sistem hanya bisa diubah super admin");
    if (existing && me.roles.some((r) => r.id === existing.id)) throw new AppError("Tidak bisa mengubah role yang Anda pegang sendiri");
    const missing = requested.filter((k) => !me.permissions.includes(k));
    if (missing.length) throw new AppError(`Anda tidak bisa memberi permission yang tidak Anda miliki: ${missing.join(", ")}`);
  }
  if (existing?.isSystem && data.name !== existing.name) throw new AppError("Nama role sistem tidak boleh diubah");

  // role sistem selalu akses penuh → permission tidak disimpan
  const role = await saveRole({ id, name: data.name, description: data.description }, existing?.isSystem ? null : requested);
  revalidatePath("/admin", "layout");
  await setFlash(`Role ${role.name} tersimpan`);
  redirect(`/admin/roles?edit=${role.id}`);
});

export const deleteRoleAction = action(async (form: FormData) => {
  await requirePermission("role.delete");
  const id = z.string().uuid().parse(form.get("id"));
  const role = await getRole(id);
  if (!role) throw notFound();
  if (role.isSystem) throw new AppError("Role sistem tidak bisa dihapus");
  const n = await countRoleUsers(id);
  if (n > 0) throw new AppError(`Role masih dipakai ${n} user`);
  await deleteRole(id);
  revalidatePath("/admin/roles");
  await setFlash(`Role ${role.name} dihapus`);
});
