import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { menus, roleMenus, userRoles } from "@/db/schema";
import type { MenuNode } from "./menu-types";

/**
 * Ambil menu sebagai tree.
 * - super_admin: semua menu (termasuk nonaktif) + daftar roleIds tiap menu.
 * - lainnya: hanya menu aktif yang terdaftar di role user.
 */
export async function getMenuTree(
  userId: string,
  roleNames: string[]
): Promise<MenuNode[]> {
  const isSuper = roleNames.includes("super_admin");

  const allMenus = await db.select().from(menus);

  let allowedIds: Set<string> | null = null;
  const menuRoles = new Map<string, string[]>();

  if (isSuper) {
    const rms = await db.select().from(roleMenus);
    for (const rm of rms) {
      const arr = menuRoles.get(rm.menuId) ?? [];
      arr.push(rm.roleId);
      menuRoles.set(rm.menuId, arr);
    }
  } else {
    const urs = await db
      .select({ roleId: userRoles.roleId })
      .from(userRoles)
      .where(eq(userRoles.userId, userId));
    const roleIds = urs.map((r) => r.roleId);
    if (roleIds.length === 0) return [];
    const rms = await db
      .select({ menuId: roleMenus.menuId })
      .from(roleMenus)
      .where(inArray(roleMenus.roleId, roleIds));
    allowedIds = new Set(rms.map((r) => r.menuId));
  }

  const filtered = allMenus
    .filter((m) => {
      if (isSuper) return true;
      return m.isActive && allowedIds!.has(m.id);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const map = new Map<string, MenuNode>();
  for (const m of filtered) {
    map.set(m.id, {
      id: m.id,
      label: m.label,
      icon: m.icon,
      path: m.path,
      sortOrder: m.sortOrder,
      isActive: m.isActive,
      roleIds: menuRoles.get(m.id) ?? [],
      children: [],
    });
  }

  const roots: MenuNode[] = [];
  for (const m of filtered) {
    const node = map.get(m.id)!;
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/** Versi flat (untuk tabel kelola menu), hanya untuk super_admin / menus.manage. */
export async function getAllMenusFlat() {
  return db.select().from(menus).orderBy(menus.sortOrder);
}
