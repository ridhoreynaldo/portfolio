import { boolean, pgTable, primaryKey, text, uuid, varchar } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
  /** Role sistem (super_admin): akses penuh, tidak bisa dihapus/dibatasi. */
  isSystem: boolean("is_system").default(false).notNull(),
});

/** Daftar permission disinkronkan dari kode (rbac/permissions.ts) oleh migrate/seed. */
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 64 }).notNull().unique(), // "project.create"
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);
