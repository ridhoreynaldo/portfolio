import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/shared/db";
import { userRoles } from "@/modules/users/schema";
import { permissions, rolePermissions, roles } from "./schema";

/** Daftar role + jumlah permission + jumlah user — 1 query (LEFT JOIN + GROUP BY), bukan COUNT per baris. */
export const listRoles = () =>
  db()
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
      permissionCount: sql<number>`count(distinct ${rolePermissions.permissionId})::int`,
      userCount: sql<number>`count(distinct ${userRoles.userId})::int`,
    })
    .from(roles)
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .leftJoin(userRoles, eq(userRoles.roleId, roles.id))
    .groupBy(roles.id)
    .orderBy(asc(roles.isSystem), asc(roles.name));

export const getRole = async (id: string) => (await db().select().from(roles).where(eq(roles.id, id)).limit(1))[0];

export const listPermissions = () => db().select().from(permissions).orderBy(asc(permissions.key));

export const rolePermissionKeys = async (roleId: string) =>
  (
    await db()
      .select({ key: permissions.key })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId))
  ).map((r) => r.key);

export async function saveRole(input: { id?: string; name: string; description: string }, permissionKeys: string[] | null) {
  return db().transaction(async (tx) => {
    const [role] = input.id
      ? await tx.update(roles).set({ name: input.name, description: input.description }).where(eq(roles.id, input.id)).returning()
      : await tx.insert(roles).values({ name: input.name, description: input.description }).returning();
    if (!role) throw new Error("Role tidak ditemukan");
    if (permissionKeys !== null) {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
      if (permissionKeys.length) {
        const ids = await tx.select({ id: permissions.id }).from(permissions).where(inArray(permissions.key, permissionKeys));
        if (ids.length) await tx.insert(rolePermissions).values(ids.map((p) => ({ roleId: role.id, permissionId: p.id })));
      }
    }
    return role;
  });
}

export const deleteRole = (id: string) => db().delete(roles).where(eq(roles.id, id));

export const countRoleUsers = async (roleId: string) =>
  (await db().select({ n: sql<number>`count(*)::int` }).from(userRoles).where(eq(userRoles.roleId, roleId)))[0]!.n;
