import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/shared/db";
import { env } from "@/shared/env";
import { users, userRoles } from "@/modules/users/schema";
import { permissions, rolePermissions, roles } from "@/modules/rbac/schema";
import { CUSTOMER_ROLE } from "@/modules/rbac/permissions";
import { authSessions } from "./schema";

const COOKIE = "pf_session";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: { id: string; name: string; isSystem: boolean }[];
  /** Punya role sistem (super_admin) → semua permission. */
  isSuper: boolean;
  /** Punya role `customer` → boleh pakai portal pelanggan. */
  isCustomer: boolean;
  permissions: string[];
};

/** Boleh masuk panel admin: super admin atau punya minimal 1 permission. */
export const isStaff = (u: AuthUser) => u.isSuper || u.permissions.length > 0;
/** Halaman tujuan setelah login. */
export const homeFor = (u: AuthUser) => (isStaff(u) ? "/admin" : "/portal");

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + env().SESSION_TTL_DAYS * 86_400_000);
  await db().insert(authSessions).values({ id: sha256(token), userId, expiresAt, ip: meta.ip, userAgent: meta.userAgent });
  // housekeeping murah: buang sesi kedaluwarsa milik user ini
  await db().delete(authSessions).where(and(eq(authSessions.userId, userId), lt(authSessions.expiresAt, new Date())));
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env().COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db().delete(authSessions).where(eq(authSessions.id, sha256(token)));
  jar.delete(COOKIE);
}

/** Semua sesi user dicabut (nonaktif / reset password / ganti role). */
export const revokeUserSessions = (userId: string) => db().delete(authSessions).where(eq(authSessions.userId, userId));

/** 2 query per request (sesi+user, lalu role+permission); di-cache per render. */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db()
    .select({ id: users.id, email: users.email, name: users.name })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.id, sha256(token)), gt(authSessions.expiresAt, new Date()), eq(users.isActive, true)))
    .limit(1);
  if (!row) return null;
  return { ...row, ...(await loadAccess(row.id)) };
});

/** Role + permission user dalam 2 query ringan (tanpa N+1). */
export async function loadAccess(userId: string): Promise<Pick<AuthUser, "roles" | "isSuper" | "isCustomer" | "permissions">> {
  const userRoleRows = await db()
    .select({ id: roles.id, name: roles.name, isSystem: roles.isSystem })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
  const isSuper = userRoleRows.some((r) => r.isSystem);
  const isCustomer = userRoleRows.some((r) => r.name === CUSTOMER_ROLE);
  const roleIds = userRoleRows.map((r) => r.id);
  const perms = roleIds.length
    ? await db()
        .selectDistinct({ key: permissions.key })
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds))
    : [];
  return { roles: userRoleRows, isSuper, isCustomer, permissions: perms.map((p) => p.key) };
}

export const can = (user: AuthUser | null, key: string) => !!user && (user.isSuper || user.permissions.includes(key));
