import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { roles } from "@/modules/rbac/schema";
import { userRoles, users } from "./schema";

export type UserRow = typeof users.$inferSelect & { roles: { id: string; name: string; isSystem: boolean }[] };

/** Semua user + role-nya dalam 2 query (bukan 1 query per user). */
export async function listUsers(): Promise<UserRow[]> {
  const rows = await db().select().from(users).orderBy(asc(users.createdAt));
  if (!rows.length) return [];
  const ur = await db()
    .select({ userId: userRoles.userId, id: roles.id, name: roles.name, isSystem: roles.isSystem })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(inArray(userRoles.userId, rows.map((u) => u.id)));
  const byUser = new Map<string, UserRow["roles"]>();
  for (const r of ur) (byUser.get(r.userId) ?? byUser.set(r.userId, []).get(r.userId)!).push({ id: r.id, name: r.name, isSystem: r.isSystem });
  return rows.map((u) => ({ ...u, roles: byUser.get(u.id) ?? [] }));
}

export const getUser = async (id: string) => (await db().select().from(users).where(eq(users.id, id)).limit(1))[0];
export const findUserByEmail = async (email: string) => (await db().select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];

export async function saveUser(
  input: { id?: string; name: string; email: string; isActive: boolean; passwordHash?: string },
  roleIds: string[] | null,
) {
  return db().transaction(async (tx) => {
    const base = { name: input.name, email: input.email, isActive: input.isActive, updatedAt: new Date(), ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}) };
    const [user] = input.id
      ? await tx.update(users).set(base).where(eq(users.id, input.id)).returning()
      : await tx.insert(users).values({ ...base, passwordHash: input.passwordHash! }).returning();
    if (!user) throw new Error("User tidak ditemukan");
    if (roleIds !== null) {
      await tx.delete(userRoles).where(eq(userRoles.userId, user.id));
      if (roleIds.length) await tx.insert(userRoles).values(roleIds.map((roleId) => ({ userId: user.id, roleId })));
    }
    return user;
  });
}

export const deleteUser = (id: string) => db().delete(users).where(eq(users.id, id));

/** Jumlah super admin aktif (tidak boleh jadi 0). */
export const countActiveSuperAdmins = async (excludeUserId?: string) =>
  (
    await db()
      .select({ n: sql<number>`count(distinct ${users.id})::int` })
      .from(users)
      .innerJoin(userRoles, eq(userRoles.userId, users.id))
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(and(eq(users.isActive, true), eq(roles.isSystem, true), excludeUserId ? sql`${users.id} <> ${excludeUserId}` : undefined))
  )[0]!.n;
