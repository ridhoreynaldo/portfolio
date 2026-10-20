import { and, asc, eq } from "drizzle-orm";
import { db } from "@/shared/db";
import { can, type AuthUser } from "@/modules/auth/session";
import { menus } from "./schema";

export type MenuRow = typeof menus.$inferSelect;
export type MenuNode = MenuRow & { children: MenuRow[] };

export const listMenus = () => db().select().from(menus).orderBy(asc(menus.scope), asc(menus.sortOrder), asc(menus.label));

export const getMenu = async (id: string) => (await db().select().from(menus).where(eq(menus.id, id)).limit(1))[0];

/**
 * Sidebar admin: menu ADMIN aktif yang permission-nya dimiliki user, disusun induk → anak.
 * Grup (path "#") hanya tampil kalau punya anak yang terlihat.
 */
export async function adminMenuTree(user: AuthUser): Promise<MenuNode[]> {
  const rows = await db()
    .select()
    .from(menus)
    .where(and(eq(menus.scope, "ADMIN"), eq(menus.isActive, true)))
    .orderBy(asc(menus.sortOrder), asc(menus.label));
  const visible = rows.filter((m) => !m.permissionKey || can(user, m.permissionKey));
  const byParent = new Map<string | null, MenuRow[]>();
  for (const m of visible) (byParent.get(m.parentId) ?? byParent.set(m.parentId, []).get(m.parentId)!).push(m);
  return (byParent.get(null) ?? [])
    .map((m) => ({ ...m, children: byParent.get(m.id) ?? [] }))
    .filter((m) => m.path !== "#" || m.children.length > 0);
}

/** Navigasi publik: menu PUBLIC aktif (href = #section). */
export const publicMenus = () =>
  db()
    .select({ id: menus.id, label: menus.label, path: menus.path })
    .from(menus)
    .where(and(eq(menus.scope, "PUBLIC"), eq(menus.isActive, true)))
    .orderBy(asc(menus.sortOrder));

export const insertMenu = async (v: typeof menus.$inferInsert) => (await db().insert(menus).values(v).returning())[0]!;
export const updateMenu = (id: string, v: Partial<typeof menus.$inferInsert>) => db().update(menus).set(v).where(eq(menus.id, id));
export const deleteMenu = (id: string) => db().delete(menus).where(eq(menus.id, id));
