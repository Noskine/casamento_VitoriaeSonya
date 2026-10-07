CREATE TABLE "gift_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'reserved' NOT NULL,
	"payment_status" varchar(20),
	"payment_method" varchar(30),
	"payment_id" varchar(64),
	"paid_at" timestamp with time zone,
	"amount_cents" integer,
	"contribution_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_reservations_status_check" CHECK ("gift_reservations"."status" in ('reserved', 'paid', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"image_url" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"external_link" text,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orphan_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" varchar(64) NOT NULL,
	"reservation_id" uuid,
	"amount_cents" integer NOT NULL,
	"method" varchar(30),
	"payer_name" varchar(200),
	"payer_email" varchar(200),
	"refund_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"refund_id" varchar(64),
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orphan_payments_refund_status_check" CHECK ("orphan_payments"."refund_status" in ('pending', 'refunded', 'failed', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"phone" varchar(30),
	"attending" varchar(3) NOT NULL,
	"guests" integer DEFAULT 0 NOT NULL,
	"guest_names" text,
	"diet" text,
	"message" text,
	"ip_hash" varchar(64),
	"user_agent" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rsvps_attending_check" CHECK ("rsvps"."attending" in ('yes', 'no')),
	CONSTRAINT "rsvps_guests_range" CHECK ("rsvps"."guests" between 0 and 6)
);
--> statement-breakpoint
ALTER TABLE "gift_reservations" ADD CONSTRAINT "gift_reservations_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gift_reservations_gift_id_idx" ON "gift_reservations" USING btree ("gift_id");--> statement-breakpoint
CREATE INDEX "gift_reservations_payment_id_idx" ON "gift_reservations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "gift_reservations_status_idx" ON "gift_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gift_reservations_pending_idx" ON "gift_reservations" USING btree ("created_at") WHERE "gift_reservations"."status" = 'reserved' and "gift_reservations"."payment_status" = 'pending';--> statement-breakpoint
CREATE INDEX "gifts_position_idx" ON "gifts" USING btree ("position");--> statement-breakpoint
CREATE INDEX "gifts_active_idx" ON "gifts" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "orphan_payments_payment_id_unique" ON "orphan_payments" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "orphan_payments_created_at_idx" ON "orphan_payments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orphan_payments_refund_status_idx" ON "orphan_payments" USING btree ("refund_status");--> statement-breakpoint
CREATE UNIQUE INDEX "rsvps_email_unique" ON "rsvps" USING btree ("email");--> statement-breakpoint
CREATE INDEX "rsvps_attending_idx" ON "rsvps" USING btree ("attending");--> statement-breakpoint
CREATE INDEX "rsvps_created_at_idx" ON "rsvps" USING btree ("created_at");