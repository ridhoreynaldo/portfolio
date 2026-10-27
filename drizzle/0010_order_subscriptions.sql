ALTER TABLE "orders" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "unit_price" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "item_label" varchar(32) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "item_limit" integer;