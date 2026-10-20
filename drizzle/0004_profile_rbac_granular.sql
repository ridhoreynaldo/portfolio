CREATE TYPE "public"."menu_scope" AS ENUM('ADMIN', 'PUBLIC');--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"ip" varchar(64),
	"user_agent" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"issuer" varchar(255) NOT NULL,
	"issue_date" date NOT NULL,
	"expiry_date" date,
	"credential_url" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"site_name" varchar(128) DEFAULT '' NOT NULL,
	"full_name" varchar(255) DEFAULT '' NOT NULL,
	"headline" varchar(255) DEFAULT '' NOT NULL,
	"tagline" varchar(255) DEFAULT '' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"phone" varchar(64) DEFAULT '' NOT NULL,
	"location" varchar(255) DEFAULT '' NOT NULL,
	"birth_place" varchar(255) DEFAULT '' NOT NULL,
	"birth_date" date,
	"gender" varchar(32) DEFAULT '' NOT NULL,
	"nationality" varchar(64) DEFAULT '' NOT NULL,
	"religion" varchar(64) DEFAULT '' NOT NULL,
	"marital_status" varchar(64) DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"github" text DEFAULT '' NOT NULL,
	"linkedin" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"category" varchar(64) DEFAULT 'General' NOT NULL,
	"level" integer DEFAULT 50 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "scope" "menu_scope" DEFAULT 'ADMIN' NOT NULL;--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN "permission_key" varchar(64);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "role" varchar(128);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_sessions_user_idx" ON "auth_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_exp_idx" ON "auth_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "projects_published_idx" ON "projects" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE INDEX "menus_scope_active_idx" ON "menus" USING btree ("scope","is_active","sort_order");--> statement-breakpoint
-- ── Migrasi data dari versi 1 (ditulis tangan) ───────────────────────────────────────────
-- site_settings (key-value) → profile (singleton). Nilai yang tidak ada menjadi ''.
INSERT INTO "profile" ("id", "site_name", "headline", "tagline", "summary", "about", "email", "phone", "github", "linkedin")
SELECT 1,
  coalesce((SELECT value FROM site_settings WHERE key = 'site_name'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'hero_title'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'tagline'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'hero_subtitle'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'about_text'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'contact_email'), (SELECT value FROM site_settings WHERE key = 'email'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'contact_phone'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'github_url'), ''),
  coalesce((SELECT value FROM site_settings WHERE key = 'contact_linkedin'), (SELECT value FROM site_settings WHERE key = 'linkedin_url'), '')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
UPDATE "roles" SET "is_system" = true WHERE "name" = 'super_admin';--> statement-breakpoint
-- Visibilitas menu kini berdasarkan permission (menus.permission_key), bukan role_menus.
DROP TABLE "role_menus" CASCADE;--> statement-breakpoint
DROP TABLE "site_settings" CASCADE;
