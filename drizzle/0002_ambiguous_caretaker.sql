ALTER TABLE "experiences" ADD COLUMN "icon" varchar(64);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "tech_stack" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "detail_description" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_users" varchar(64);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "concurrent_users" varchar(64);