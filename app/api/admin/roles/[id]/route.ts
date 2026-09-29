import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roleMenus, rolePermissions, roles } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("roles.manage");
    const { id } = await params;
    const { name, description, permissionIds, menuIds } = await req.json();
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing) {
      return NextResponse.json({ error: "Peran tidak ditemukan" }, { status: 404 });
    }
    if (existing.name === "super_admin" && name && name !== "super_admin") {
      return NextResponse.json(
        { error: "Nama peran super_admin tidak boleh diubah" },
        { status: 400 }
      );
    }
    const [role] = await db
      .update(roles)
      .set({
        name: String(name ?? existing.name).trim(),
        description: description ?? existing.description,
      })
      .where(eq(roles.id, id))
      .returning();

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        }))
      );
    }
    await db.delete(roleMenus).where(eq(roleMenus.roleId, id));
    if (Array.isArray(menuIds) && menuIds.length > 0) {
      await db.insert(roleMenus).values(
        menuIds.map((menuId: string) => ({ roleId: id, menuId }))
      );
    }
    return NextResponse.json({ role });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Nama peran sudah ada" }, { status: 409 });
    }
    return apiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("roles.manage");
    const { id } = await params;
    const [existing] = await db.select().from(roles).where(eq(roles.id, id));
    if (!existing) {
      return NextResponse.json({ error: "Peran tidak ditemukan" }, { status: 404 });
    }
    if (existing.name === "super_admin") {
      return NextResponse.json(
        { error: "Peran super_admin tidak boleh dihapus" },
        { status: 400 }
      );
    }
    await db.delete(roles).where(eq(roles.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
