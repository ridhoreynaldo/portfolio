"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/shared/db";
import { action, setFlash } from "@/shared/action";
import { AppError } from "@/shared/errors";
import { users } from "@/modules/users/schema";
import { DUMMY_HASH, hashPassword, verifyPassword } from "./password";
import { createSession, destroySession, getCurrentUser, revokeUserSessions } from "./session";
import { clearLoginLimit, hitLoginLimit } from "./rate-limit";

const loginInput = z.object({ email: z.string().email(), password: z.string().min(1) });

export type LoginState = { error?: string };

async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = loginInput.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Email atau password tidak valid" };
  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();

  const rl = hitLoginLimit(`${ip}:${email}`);
  if (rl.blocked) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil(rl.retryAfterSec / 60)} menit.` };

  const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  const { ok, needsRehash } = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.isActive) return { error: "Email atau password salah" };

  clearLoginLimit(`${ip}:${email}`);
  const patch: Partial<typeof users.$inferInsert> = { lastLoginAt: new Date() };
  if (needsRehash) patch.passwordHash = await hashPassword(parsed.data.password); // migrasi bcrypt → scrypt
  await db().update(users).set(patch).where(eq(users.id, user.id));
  await createSession(user.id, { ip, userAgent: (await headers()).get("user-agent") ?? undefined });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const changeInput = z
  .object({ current: z.string().min(1), next: z.string().min(8).max(128), confirm: z.string() })
  .refine((v) => v.next === v.confirm, "Konfirmasi password tidak sama");

/** Ganti password sendiri; semua sesi lain dicabut lalu login ulang. */
export const changePasswordAction = action(async (form: FormData) => {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const data = changeInput.parse(Object.fromEntries(form));
  const [row] = await db().select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id)).limit(1);
  if (!row || !(await verifyPassword(data.current, row.hash)).ok) throw new AppError("Password lama salah");
  await db().update(users).set({ passwordHash: await hashPassword(data.next), updatedAt: new Date() }).where(eq(users.id, me.id));
  await revokeUserSessions(me.id);
  await setFlash("Password diubah. Silakan login lagi.");
  redirect("/login");
});
