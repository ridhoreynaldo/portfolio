import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { menus, roleMenus } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { getMenuTree } from "@/lib/menus";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requirePermission("menus.manage");
    const tree = await getMenuTree(session.sub, session.roles);
    return NextResponse.json({ tree });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("menus.manage");
    const body = await req.json();
    const { label, icon, path, parentId, sortOrder, isActive, roleIds } = body;
    if (!label) {
      return NextResponse.json({ error: "Label wajib diisi" }, { status: 400 });
    }
    const [menu] = await db
      .insert(menus)
      .values({
        label: String(label),
        icon: String(icon || "LayoutDashboard"),
        path: String(path || "#"),
        parentId: parentId || null,
        sortOrder: Number(sortOrder ?? 0),
        isActive: isActive !== false,
      })
      .returning();
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      await db.insert(roleMenus).values(
        roleIds.map((roleId: string) => ({ roleId, menuId: menu.id }))
      );
    }
    return NextResponse.json({ menu }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
