"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { action, setFlash } from "@/shared/action";
import { AppError, notFound } from "@/shared/errors";
import { requirePermission } from "@/modules/auth/guards";
import { PERMISSION_KEYS } from "@/modules/rbac/permissions";
import { revalidatePortfolio } from "@/modules/portfolio/service";
import { deleteMenu, getMenu, insertMenu, updateMenu } from "./repository";

const input = z
  .object({
    id: z.string().uuid().optional(),
    scope: z.enum(["ADMIN", "PUBLIC"]),
    label: z.string().trim().min(1).max(128),
    path: z.string().trim().min(1).max(255),
    icon: z.string().trim().max(64).default("LayoutDashboard"),
    permissionKey: z.string().trim().max(64).default(""),
    parentId: z.string().uuid().optional(),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    isActive: z.boolean(),
  })
  .refine((v) => (v.scope === "PUBLIC" ? /^#[a-z0-9-]+$/.test(v.path) : /^(#|\/admin(\/[a-z0-9\-/]*)?)$/.test(v.path)), {
    message: "Path: PUBLIC harus #section-id (huruf kecil), ADMIN harus /admin/... atau # untuk grup",
  })
  .refine((v) => !v.permissionKey || PERMISSION_KEYS.has(v.permissionKey), { message: "Permission tidak dikenal" });

export const saveMenuAction = action(async (form: FormData) => {
  const id = String(form.get("id") || "") || undefined;
  await requirePermission(`menu.${id ? "update" : "create"}`);
  const data = input.parse({
    id,
    scope: form.get("scope"),
    label: form.get("label"),
    path: form.get("path"),
    icon: form.get("icon") || "LayoutDashboard",
    permissionKey: form.get("permissionKey") ?? "",
    parentId: String(form.get("parentId") || "") || undefined,
    sortOrder: form.get("sortOrder") || 0,
    isActive: form.get("isActive") === "on",
  });
  if (data.parentId) {
    if (data.parentId === id) throw new AppError("Menu tidak bisa menjadi induk dirinya sendiri");
    const parent = await getMenu(data.parentId);
    if (!parent || parent.scope !== "ADMIN" || parent.parentId) throw new AppError("Induk harus menu ADMIN tingkat atas");
  }
  const values = {
    scope: data.scope,
    label: data.label,
    path: data.path,
    icon: data.icon,
    permissionKey: data.scope === "ADMIN" && data.permissionKey ? data.permissionKey : null,
    parentId: data.scope === "ADMIN" ? (data.parentId ?? null) : null,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
  };
  if (id) {
    if (!(await getMenu(id))) throw notFound();
    await updateMenu(id, values);
  } else await insertMenu(values);
  revalidatePath("/admin", "layout");
  revalidatePortfolio();
  await setFlash(`Menu ${data.label} tersimpan`);
  redirect("/admin/menus");
});

export const deleteMenuAction = action(async (form: FormData) => {
  await requirePermission("menu.delete");
  const id = z.string().uuid().parse(form.get("id"));
  const m = await getMenu(id);
  if (!m) throw notFound();
  await deleteMenu(id); // anak ikut terhapus (cascade)
  revalidatePath("/admin", "layout");
  revalidatePortfolio();
  await setFlash(`Menu ${m.label} dihapus`);
});
