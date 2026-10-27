ALTER TABLE "invoices" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL;