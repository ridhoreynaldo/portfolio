import { asc, desc, eq, getTableColumns, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/shared/db";
import { certifications, experiences, profile, projects, skills } from "./schema";
import type { ResourceKey } from "./resources";

export type Row = Record<string, unknown> & { id: string };

// ── Resource generik (experience / certification / skill) ─────────────────────
const TABLES: Record<ResourceKey, { table: PgTable; order: () => (SQL | PgColumn)[] }> = {
  experience: { table: experiences, order: () => [asc(experiences.sortOrder), desc(experiences.createdAt)] },
  certification: { table: certifications, order: () => [asc(certifications.sortOrder), desc(certifications.issueDate)] },
  skill: { table: skills, order: () => [asc(skills.category), asc(skills.sortOrder), asc(skills.name)] },
};

const idCol = (t: PgTable) => getTableColumns(t).id as PgColumn;

export const listRows = (key: ResourceKey): Promise<Row[]> => {
  const { table, order } = TABLES[key];
  return db().select().from(table).orderBy(...order()) as unknown as Promise<Row[]>;
};

export const insertRow = (key: ResourceKey, data: Record<string, unknown>) =>
  db().insert(TABLES[key].table).values(data as never);

export const updateRow = (key: ResourceKey, id: string, data: Record<string, unknown>) =>
  db().update(TABLES[key].table).set(data as never).where(eq(idCol(TABLES[key].table), id));

export const deleteRow = (key: ResourceKey, id: string) => db().delete(TABLES[key].table).where(eq(idCol(TABLES[key].table), id));

// ── Profil (singleton id=1) ───────────────────────────────────────────────────
export const getProfile = async () => (await db().select().from(profile).where(eq(profile.id, 1)).limit(1))[0];

export const upsertProfile = (data: Partial<typeof profile.$inferInsert>) =>
  db()
    .insert(profile)
    .values({ id: 1, ...data })
    .onConflictDoUpdate({ target: profile.id, set: { ...data, updatedAt: new Date() } });

// ── Project ───────────────────────────────────────────────────────────────────
export const listProjects = () => db().select().from(projects).orderBy(desc(projects.isFeatured), asc(projects.sortOrder), desc(projects.createdAt));
export const getProject = async (id: string) => (await db().select().from(projects).where(eq(projects.id, id)).limit(1))[0];
export const insertProject = async (v: typeof projects.$inferInsert) => (await db().insert(projects).values(v).returning())[0]!;
export const updateProject = (id: string, v: Partial<typeof projects.$inferInsert>) =>
  db().update(projects).set({ ...v, updatedAt: new Date() }).where(eq(projects.id, id));
export const deleteProject = (id: string) => db().delete(projects).where(eq(projects.id, id));

/** Slug unik: tambah akhiran -2, -3 … bila bentrok (1 query). */
export async function uniqueSlug(base: string, excludeId?: string) {
  const rows = await db()
    .select({ slug: projects.slug })
    .from(projects)
    .where(excludeId ? sql`${projects.slug} like ${base + "%"} and ${projects.id} <> ${excludeId}` : sql`${projects.slug} like ${base + "%"}`);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 80) || "project";
