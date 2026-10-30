ALTER TABLE "invoices" ADD COLUMN "bill_to" varchar(160) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bill_to" varchar(160) DEFAULT '' NOT NULL;