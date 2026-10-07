// lib/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*  RSVPs — confirmações de presença                                           */
/* -------------------------------------------------------------------------- */

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    attending: varchar("attending", { length: 3 }).notNull(),
    guests: integer("guests").notNull().default(0),
    guestNames: text("guest_names"),
    diet: text("diet"),
    message: text("message"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("rsvps_email_unique").on(t.email),
    index("rsvps_attending_idx").on(t.attending),
    index("rsvps_created_at_idx").on(t.createdAt),
    check("rsvps_attending_check", sql`${t.attending} in ('yes', 'no')`),
    check("rsvps_guests_range", sql`${t.guests} between 0 and 6`),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Gifts — lista de presentes                                                 */
/* -------------------------------------------------------------------------- */

export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents").notNull().default(0),
    externalLink: text("external_link"),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("gifts_position_idx").on(t.position),
    index("gifts_active_idx").on(t.active),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Gift reservations — reservas e contribuições (vaquinha)                    */
/* -------------------------------------------------------------------------- */

export const giftReservations = pgTable(
  "gift_reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    giftId: uuid("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    message: text("message"),
    status: varchar("status", { length: 20 }).notNull().default("reserved"),
    paymentStatus: varchar("payment_status", { length: 20 }),
    paymentMethod: varchar("payment_method", { length: 30 }),
    paymentId: varchar("payment_id", { length: 64 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    amountCents: integer("amount_cents"),
    contributionCents: integer("contribution_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("gift_reservations_gift_id_idx").on(t.giftId),
    index("gift_reservations_payment_id_idx").on(t.paymentId),
    index("gift_reservations_status_idx").on(t.status),
    // Para o cron de expiração — só reservas pendentes
    index("gift_reservations_pending_idx")
      .on(t.createdAt)
      .where(sql`${t.status} = 'reserved' and ${t.paymentStatus} = 'pending'`),
    check(
      "gift_reservations_status_check",
      sql`${t.status} in ('reserved', 'paid', 'cancelled')`,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Orphan payments — pagamentos órfãos (reserva expirou, mas pagou)          */
/* -------------------------------------------------------------------------- */

export const orphanPayments = pgTable(
  "orphan_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: varchar("payment_id", { length: 64 }).notNull(),
    reservationId: uuid("reservation_id"),
    amountCents: integer("amount_cents").notNull(),
    method: varchar("method", { length: 30 }),
    payerName: varchar("payer_name", { length: 200 }),
    payerEmail: varchar("payer_email", { length: 200 }),
    refundStatus: varchar("refund_status", { length: 20 })
      .notNull()
      .default("pending"),
    refundId: varchar("refund_id", { length: 64 }),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("orphan_payments_payment_id_unique").on(t.paymentId),
    index("orphan_payments_created_at_idx").on(t.createdAt),
    index("orphan_payments_refund_status_idx").on(t.refundStatus),
    check(
      "orphan_payments_refund_status_check",
      sql`${t.refundStatus} in ('pending', 'refunded', 'failed', 'manual')`,
    ),
  ],
);