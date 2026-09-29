import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { apiError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requirePermission("users.manage");
    const { id } = await params;
    const { name, email, password, roleIds, isActive } = await req.json();
    if (!name || !email) {
      return NextResponse.json(
        { error: "Nama dan email wajib diisi" },
        { status: 400 }
      );
    }
    const patch: Partial<typeof users.$inferInsert> = {
      name: String(name),
      email: String(email).toLowerCase().trim(),
      isActive: isActive !== false,
      updatedAt: new Date(),
    };
    if (password) {
      patch.passwordHash = await hashPassword(String(password));
    }
    const [user] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    await db.delete(userRoles).where(eq(userRoles.userId, id));
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      await db.insert(userRoles).values(
        roleIds.map((roleId: string) => ({ userId: id, roleId }))
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    return apiError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await requirePermission("users.manage");
    const { id } = await params;
    if (id === session.sub) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus akun sendiri" },
        { status: 400 }
      );
    }
    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
