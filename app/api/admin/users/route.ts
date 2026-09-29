import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { requirePermission } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";
import { apiError } from "@/lib/api";

export async function GET() {
  try {
    await requirePermission("users.manage");
    const allUsers = await db.select().from(users);
    const allRoles = await db.select().from(roles);
    const urs = await db.select().from(userRoles);
    const roleMap = new Map(allRoles.map((r) => [r.id, r.name]));
    const data = allUsers.map((u) => {
      const rids = urs.filter((x) => x.userId === u.id).map((x) => x.roleId);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        isActive: u.isActive,
        createdAt: u.createdAt,
        roleIds: rids,
        roles: rids.map((id) => roleMap.get(id)).filter(Boolean),
      };
    });
    return NextResponse.json({ users: data, roles: allRoles });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("users.manage");
    const { name, email, password, roleIds, isActive } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }
    const [user] = await db
      .insert(users)
      .values({
        name: String(name),
        email: String(email).toLowerCase().trim(),
        passwordHash: await hashPassword(String(password)),
        isActive: isActive !== false,
      })
      .returning();
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      await db.insert(userRoles).values(
        roleIds.map((roleId: string) => ({ userId: user.id, roleId }))
      );
    }
    return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 });
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    return apiError(e);
  }
}
