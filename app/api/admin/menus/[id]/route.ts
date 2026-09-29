import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menus, roleMenus } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { apiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("menus.manage");
    const { id } = await params;
    const body = await req.json();
    const { label, icon, path, parentId, sortOrder, isActive, roleIds } = body;
    if (!label) {
      return NextResponse.json({ error: "Label wajib diisi" }, { status: 400 });
    }
    if (parentId === id) {
      return NextResponse.json(
        { error: "Menu tidak bisa menjadi parent dirinya sendiri" },
        { status: 400 }
      );
    }
    const [menu] = await db
      .update(menus)
      .set({
        label: String(label),
        icon: String(icon || "LayoutDashboard"),
        path: String(path || "#"),
        parentId: parentId || null,
        sortOrder: Number(sortOrder ?? 0),
        isActive: isActive !== false,
      })
      .where(eq(menus.id, id))
      .returning();
    if (!menu) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }
    await db.delete(roleMenus).where(eq(roleMenus.menuId, id));
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      await db.insert(roleMenus).values(
        roleIds.map((roleId: string) => ({ roleId, menuId: id }))
      );
    }
    return NextResponse.json({ menu });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("menus.manage");
    const { id } = await params;
    await db.delete(menus).where(eq(menus.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
