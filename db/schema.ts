import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Auth & RBAC
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })]
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

// ---------------------------------------------------------------------------
// Menu dinamis
// ---------------------------------------------------------------------------

export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references((): AnyPgColumn => menus.id, {
    onDelete: "cascade",
  }),
  label: varchar("label", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("LayoutDashboard").notNull(),
  path: varchar("path", { length: 255 }).default("#").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const roleMenus = pgTable(
  "role_menus",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    menuId: uuid("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.menuId] })]
);

// ---------------------------------------------------------------------------
// Konten portfolio
// ---------------------------------------------------------------------------

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  demoUrl: text("demo_url"),
  repoUrl: text("repo_url"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 128 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Project = typeof projects.$inferSelect;
