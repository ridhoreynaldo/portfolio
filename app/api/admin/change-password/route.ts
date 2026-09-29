import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/rbac";
import { comparePassword, hashPassword } from "@/lib/password";
import { apiError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Kata sandi lama dan baru wajib diisi" },
        { status: 400 }
      );
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json(
        { error: "Kata sandi baru minimal 6 karakter" },
        { status: 400 }
      );
    }
    const [user] = await db.select().from(users).where(eq(users.id, session.sub));
    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }
    const ok = await comparePassword(String(currentPassword), user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Kata sandi lama salah" },
        { status: 401 }
      );
    }
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(String(newPassword)), updatedAt: new Date() })
      .where(eq(users.id, session.sub));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
