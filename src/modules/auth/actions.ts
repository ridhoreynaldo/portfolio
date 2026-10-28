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
import { createSession, destroySession, getCurrentUser, homeFor, isStaff, loadAccess, revokeUserSessions } from "./session";
import { userRoles } from "@/modules/users/schema";
import { roles } from "@/modules/rbac/schema";
import { CUSTOMER_ROLE } from "@/modules/rbac/permissions";
import { customerProfiles } from "@/modules/billing/schema";
import { clearLoginLimit, hitLoginLimit } from "./rate-limit";

const loginInput = z.object({ email: z.string().email(), password: z.string().min(1) });

export type LoginState = { error?: string };

/** Hanya path relatif internal yang boleh jadi tujuan redirect (anti open-redirect). */
function safeNext(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : fallback;
}

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
  const access = await loadAccess(user.id);
  redirect(safeNext(form.get("next"), homeFor({ id: user.id, email: user.email, name: user.name, ...access })));
}

const registerInput = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
    email: z.string().trim().email("Email tidak valid").transform((s) => s.toLowerCase()),
    phone: z.string().trim().max(64).default(""),
    company: z.string().trim().max(128).default(""),
    password: z.string().min(8, "Password minimal 8 karakter").max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Konfirmasi password tidak sama", path: ["confirm"] });

export type RegisterState = { error?: string };

/** Pendaftaran akun pelanggan (role `customer`) dari halaman /register; langsung login. */
export async function registerAction(_: RegisterState, form: FormData): Promise<RegisterState> {
  const parsed = registerInput.safeParse({
    name: form.get("name"), email: form.get("email"), phone: form.get("phone") ?? "", company: form.get("company") ?? "",
    password: form.get("password"), confirm: form.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
  const d = parsed.data;
  const ip = await clientIp();
  const rl = hitLoginLimit(`register:${ip}`);
  if (rl.blocked) return { error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." };

  const [dup] = await db().select({ id: users.id }).from(users).where(eq(users.email, d.email)).limit(1);
  if (dup) return { error: "Email sudah terdaftar. Silakan login." };
  const [role] = await db().select({ id: roles.id }).from(roles).where(eq(roles.name, CUSTOMER_ROLE)).limit(1);
  if (!role) return { error: "Role pelanggan belum tersedia. Hubungi admin." };

  const userId = await db().transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ email: d.email, name: d.name, passwordHash: await hashPassword(d.password) }).returning({ id: users.id });
    await tx.insert(userRoles).values({ userId: u!.id, roleId: role.id });
    await tx.insert(customerProfiles).values({ userId: u!.id, phone: d.phone, company: d.company });
    return u!.id;
  });
  await createSession(userId, { ip, userAgent: (await headers()).get("user-agent") ?? undefined });
  redirect(safeNext(form.get("next"), "/medan/dashboard"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function logoutToHomeAction() {
  await destroySession();
  redirect("/medan");
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
  redirect(isStaff(me) ? "/login" : "/medan/login");
});
