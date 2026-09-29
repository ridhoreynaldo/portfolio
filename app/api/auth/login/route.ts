import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "@/db/schema";
import { comparePassword } from "@/lib/password";
import { createToken, setSessionCookie } from "@/lib/auth";
import { apiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, String(email).toLowerCase().trim()));
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }
    const ok = await comparePassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    const urs = await db
      .select({ roleId: userRoles.roleId, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));
    const roleNames = urs.map((r) => r.name);

    let perms: string[];
    if (roleNames.includes("super_admin")) {
      perms = (await db.select({ key: permissions.key }).from(permissions)).map(
        (p) => p.key
      );
    } else if (urs.length > 0) {
      const rows = await db
        .select({ key: permissions.key })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
          inArray(
            rolePermissions.roleId,
            urs.map((r) => r.roleId)
          )
        );
      perms = [...new Set(rows.map((r) => r.key))];
    } else {
      perms = [];
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: roleNames,
      perms,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, roles: roleNames },
    });
  } catch (e) {
    return apiError(e);
  }
}
