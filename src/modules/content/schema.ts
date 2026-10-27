import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/** Singleton (id = 1): identitas, hero, kontak, biodata. Menggantikan tabel key-value site_settings. */
export const profile = pgTable("profile", {
  id: integer("id").primaryKey().default(1),
  siteName: varchar("site_name", { length: 128 }).default("").notNull(), // brand di navbar
  serviceBrand: varchar("service_brand", { length: 128 }).default("").notNull(), // brand halaman jasa (/jasa), terpisah dari nama pribadi
  serviceTagline: varchar("service_tagline", { length: 255 }).default("").notNull(),
  /** Tampilkan harga paket di halaman jasa; false = "hubungi via WhatsApp" (harga tetap dipakai internal untuk tagihan). */
  showServicePrices: boolean("show_service_prices").default(false).notNull(),
  fullName: varchar("full_name", { length: 255 }).default("").notNull(),
  headline: varchar("headline", { length: 255 }).default("").notNull(), // judul hero
  tagline: varchar("tagline", { length: 255 }).default("").notNull(), // badge kecil di atas judul
  summary: text("summary").default("").notNull(), // sub-judul hero
  about: text("about").default("").notNull(),
  photoUrl: text("photo_url").default("").notNull(),
  email: varchar("email", { length: 255 }).default("").notNull(),
  phone: varchar("phone", { length: 64 }).default("").notNull(),
  location: varchar("location", { length: 255 }).default("").notNull(),
  birthPlace: varchar("birth_place", { length: 255 }).default("").notNull(),
  birthDate: date("birth_date", { mode: "string" }),
  gender: varchar("gender", { length: 32 }).default("").notNull(),
  nationality: varchar("nationality", { length: 64 }).default("").notNull(),
  religion: varchar("religion", { length: 64 }).default("").notNull(),
  maritalStatus: varchar("marital_status", { length: 64 }).default("").notNull(),
  website: text("website").default("").notNull(),
  github: text("github").default("").notNull(),
  linkedin: text("linkedin").default("").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const experiences = pgTable("experiences", {
  id: uuid("id").primaryKey().defaultRandom(),
  company: varchar("company", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  /** Teks bebas, mis. "Jan 2022" — mengikuti data lama. */
  startDate: varchar("start_date", { length: 64 }).notNull(),
  endDate: varchar("end_date", { length: 64 }),
  isCurrent: boolean("is_current").default(false).notNull(),
  description: text("description").notNull(),
  /** Nama ikon (lihat components/exp-icon.tsx). */
  icon: varchar("icon", { length: 64 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const certifications = pgTable("certifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }).notNull(),
  issueDate: date("issue_date", { mode: "string" }).notNull(),
  expiryDate: date("expiry_date", { mode: "string" }),
  credentialUrl: text("credential_url").default("").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).default("General").notNull(),
  /** 0–100 */
  level: integer("level").default(50).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description").notNull(),
    detailDescription: text("detail_description"),
    role: varchar("role", { length: 128 }),
    year: integer("year"),
    imageUrl: text("image_url"),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    techStack: jsonb("tech_stack").$type<string[]>().default([]).notNull(),
    /** URL ikon kustom per tag/tech: { "Laravel": "https://…/laravel.svg" } */
    tagIcons: jsonb("tag_icons").$type<Record<string, string>>().default({}).notNull(),
    totalUsers: varchar("total_users", { length: 64 }),
    concurrentUsers: varchar("concurrent_users", { length: 64 }),
    demoUrl: text("demo_url"),
    repoUrl: text("repo_url"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("projects_published_idx").on(t.isPublished, t.sortOrder)],
);
