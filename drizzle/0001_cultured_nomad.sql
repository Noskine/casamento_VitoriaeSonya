CREATE TABLE "orphan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" varchar(64) NOT NULL,
	"reservation_id" varchar(64),
	"amount_cents" integer NOT NULL,
	"method" varchar(30),
	"payer_name" varchar(120),
	"payer_email" varchar(200),
	"refund_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"refund_id" varchar(64),
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orphan_payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
ALTER TABLE "gift_reservations" ADD COLUMN "contribution_cents" integer;--> statement-breakpoint
CREATE INDEX "orphan_payments_created_at_idx" ON "orphan_payments" USING btree ("created_at" DESC NULLS LAST);