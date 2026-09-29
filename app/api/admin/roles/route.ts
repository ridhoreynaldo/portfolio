import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menus, permissions, roleMenus, rolePermissions, roles } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    await requirePermission("roles.manage");
    const allRoles = await db.select().from(roles);
    const allPerms = await db.select().from(permissions);
    const allMenus = await db.select().from(menus);
    const rps = await db.select().from(rolePermissions);
    const rms = await db.select().from(roleMenus);
    const data = allRoles.map((r) => ({
      ...r,
      permissionIds: rps.filter((x) => x.roleId === r.id).map((x) => x.permissionId),
      menuIds: rms.filter((x) => x.roleId === r.id).map((x) => x.menuId),
    }));
    return NextResponse.json({
      roles: data,
      permissions: allPerms,
      menus: allMenus,
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("roles.manage");
    const { name, description, permissionIds, menuIds } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nama peran wajib diisi" }, { status: 400 });
    }
    const [role] = await db
      .insert(roles)
      .values({ name: String(name).trim(), description: description || null })
      .returning();
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId: string) => ({
          roleId: role.id,
          permissionId,
        }))
      );
    }
    if (Array.isArray(menuIds) && menuIds.length > 0) {
      await db.insert(roleMenus).values(
        menuIds.map((menuId: string) => ({ roleId: role.id, menuId }))
      );
    }
    return NextResponse.json({ role }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Nama peran sudah ada" }, { status: 409 });
    }
    return apiError(e);
  }
}
