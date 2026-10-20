"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/shared/db";
import { action, setFlash } from "@/shared/action";
import { AppError, notFound } from "@/shared/errors";
import { requirePermission } from "@/modules/auth/guards";
import { hashPassword } from "@/modules/auth/password";
import { loadAccess, revokeUserSessions } from "@/modules/auth/session";
import { roles } from "@/modules/rbac/schema";
import { countActiveSuperAdmins, deleteUser, findUserByEmail, getUser, saveUser } from "./repository";

const input = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().transform((s) => s.toLowerCase()),
  password: z.string().max(128).default(""),
  isActive: z.boolean(),
  roleIds: z.array(z.string().uuid()),
});

export const saveUserAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  const me = await requirePermission(`user.${id ? "update" : "create"}`);
  const data = input.parse({
    id,
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password") ?? "",
    isActive: form.get("isActive") === "on",
    roleIds: form.getAll("roleIds").map(String),
  });
  if (!id && data.password.length < 8) throw new AppError("Password minimal 8 karakter");
  if (data.password && data.password.length < 8) throw new AppError("Password minimal 8 karakter");

  const existing = id ? await getUser(id) : undefined;
  if (id && !existing) throw notFound();
  const dup = await findUserByEmail(data.email);
  if (dup && dup.id !== id) throw new AppError("Email sudah terdaftar");

  const targetRoles = data.roleIds.length ? await db().select().from(roles).where(inArray(roles.id, data.roleIds)) : [];
  const assigningSystem = targetRoles.some((r) => r.isSystem);
  const targetAccess = id ? await loadAccess(id) : null;
  const isSelf = id === me.id;

  // ── Anti eskalasi hak ──
  if (!me.isSuper && (assigningSystem || targetAccess?.isSuper)) throw new AppError("Hanya super admin yang boleh mengelola akun/role sistem");
  if (isSelf && !data.isActive) throw new AppError("Tidak bisa menonaktifkan akun sendiri");
  const roleChanged = targetAccess ? JSON.stringify([...targetAccess.roles.map((r) => r.id)].sort()) !== JSON.stringify([...data.roleIds].sort()) : false;
  if (isSelf && roleChanged) throw new AppError("Tidak bisa mengubah role akun sendiri");
  // super admin terakhir tidak boleh kehilangan akses
  if (targetAccess?.isSuper && (!assigningSystem || !data.isActive) && (await countActiveSuperAdmins(id)) === 0) {
    throw new AppError("Ini super admin aktif terakhir — tidak bisa dicabut/dinonaktifkan");
  }

  const user = await saveUser(
    { id, name: data.name, email: data.email, isActive: data.isActive, passwordHash: data.password ? await hashPassword(data.password) : undefined },
    data.roleIds,
  );
  // hak akses berubah / password di-reset / dinonaktifkan → paksa login ulang (kecuali diri sendiri)
  if (id && !isSelf && (roleChanged || data.password || !data.isActive)) await revokeUserSessions(id);

  revalidatePath("/admin/users");
  await setFlash(`User ${user.email} tersimpan`);
  redirect("/admin/users");
});

export const deleteUserAction = action(async (form: FormData) => {
  const me = await requirePermission("user.delete");
  const id = z.string().uuid().parse(form.get("id"));
  if (id === me.id) throw new AppError("Tidak bisa menghapus akun sendiri");
  const target = await getUser(id);
  if (!target) throw notFound();
  const access = await loadAccess(id);
  if (access.isSuper) {
    if (!me.isSuper) throw new AppError("Hanya super admin yang boleh menghapus super admin");
    if ((await countActiveSuperAdmins(id)) === 0) throw new AppError("Ini super admin terakhir");
  }
  await deleteUser(id);
  revalidatePath("/admin/users");
  await setFlash(`User ${target.email} dihapus`);
});
