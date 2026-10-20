import { boolean, index, integer, pgEnum, pgTable, uuid, varchar, type AnyPgColumn } from "drizzle-orm/pg-core";

/** ADMIN = sidebar panel admin; PUBLIC = navigasi + section di halaman portofolio. */
export const menuScope = pgEnum("menu_scope", ["ADMIN", "PUBLIC"]);

export const menus = pgTable(
  "menus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Menu induk (grup) — hanya dipakai scope ADMIN. */
    parentId: uuid("parent_id").references((): AnyPgColumn => menus.id, { onDelete: "cascade" }),
    scope: menuScope("scope").default("ADMIN").notNull(),
    label: varchar("label", { length: 128 }).notNull(),
    /** Nama ikon lucide (ADMIN). */
    icon: varchar("icon", { length: 64 }).default("LayoutDashboard").notNull(),
    /** ADMIN: /admin/…  |  PUBLIC: #section-id  |  grup: # */
    path: varchar("path", { length: 255 }).default("#").notNull(),
    /** Menu admin hanya tampil bila user punya permission ini (null = cukup login). */
    permissionKey: varchar("permission_key", { length: 64 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (t) => [index("menus_scope_active_idx").on(t.scope, t.isActive, t.sortOrder)],
);
