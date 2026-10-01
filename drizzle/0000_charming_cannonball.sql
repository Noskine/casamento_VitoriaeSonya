CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(200) NOT NULL,
	"message" text,
	"status" varchar(20) DEFAULT 'reserved' NOT NULL,
	"payment_id" varchar(64),
	"payment_status" varchar(20),
	"payment_method" varchar(30),
	"amount_cents" integer,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_reservations_status_check" CHECK ("gift_reservations"."status" in ('reserved', 'paid', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"image_url" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"quota_cents" integer DEFAULT 0 NOT NULL,
	"external_link" text,
	"position" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rsvps" (
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
	CONSTRAINT "rsvps_email_unique" UNIQUE("email"),
	CONSTRAINT "rsvps_attending_check" CHECK ("rsvps"."attending" in ('yes', 'no')),
	CONSTRAINT "rsvps_guests_range" CHECK ("rsvps"."guests" between 0 and 6)
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conrelid = 'public.gift_reservations'::regclass
			AND contype = 'f'
	) THEN
		ALTER TABLE "gift_reservations"
			ADD CONSTRAINT "gift_reservations_gift_id_gifts_id_fk"
			FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_reservations_gift_id_idx" ON "gift_reservations" USING btree ("gift_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gift_reservations_payment_id_idx" ON "gift_reservations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gifts_position_idx" ON "gifts" USING btree ("position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gifts_active_idx" ON "gifts" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rsvps_attending_idx" ON "rsvps" USING btree ("attending");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rsvps_created_at_idx" ON "rsvps" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS rsvps_touch ON public.rsvps;--> statement-breakpoint
CREATE TRIGGER rsvps_touch BEFORE UPDATE ON public.rsvps
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();--> statement-breakpoint
DROP TRIGGER IF EXISTS gifts_touch ON public.gifts;--> statement-breakpoint
CREATE TRIGGER gifts_touch BEFORE UPDATE ON public.gifts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();--> statement-breakpoint
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.gift_reservations ENABLE ROW LEVEL SECURITY;