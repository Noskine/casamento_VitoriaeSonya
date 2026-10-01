import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    attending: varchar("attending", { length: 3 })
      .$type<"yes" | "no">()
      .notNull(),
    guests: integer("guests").notNull().default(0),
    guestNames: text("guest_names"),
    diet: text("diet"),
    message: text("message"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "rsvps_attending_check",
      sql`${table.attending} in ('yes', 'no')`,
    ),
    check("rsvps_guests_range", sql`${table.guests} between 0 and 6`),
    unique("rsvps_email_unique").on(table.email),
    index("rsvps_attending_idx").on(table.attending),
    index("rsvps_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const gifts = pgTable(
  "gifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    priceCents: integer("price_cents").notNull().default(0),
    quotaCents: integer("quota_cents").notNull().default(0),
    externalLink: text("external_link"),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gifts_position_idx").on(table.position),
    index("gifts_active_idx").on(table.active),
  ],
);

export const giftReservations = pgTable(
  "gift_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    giftId: uuid("gift_id")
      .notNull()
      .references(() => gifts.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    message: text("message"),
    status: varchar("status", { length: 20 })
      .$type<"reserved" | "paid" | "cancelled">()
      .notNull()
      .default("reserved"),
    paymentId: varchar("payment_id", { length: 64 }),
    paymentStatus: varchar("payment_status", { length: 20 }),
    paymentMethod: varchar("payment_method", { length: 30 }),
    amountCents: integer("amount_cents"),
    contributionCents: integer("contribution_cents"),
    paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "gift_reservations_status_check",
      sql`${table.status} in ('reserved', 'paid', 'cancelled')`,
    ),
    index("gift_reservations_gift_id_idx").on(table.giftId),
    index("gift_reservations_payment_id_idx").on(table.paymentId),
  ],
);

export const orphanPayments = pgTable(
  "orphan_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: varchar("payment_id", { length: 64 }).notNull().unique(),
    reservationId: varchar("reservation_id", { length: 64 }),
    amountCents: integer("amount_cents").notNull(),
    method: varchar("method", { length: 30 }),
    payerName: varchar("payer_name", { length: 120 }),
    payerEmail: varchar("payer_email", { length: 200 }),
    refundStatus: varchar("refund_status", { length: 20 })
      .$type<"pending" | "refunded" | "failed" | "manual">()
      .notNull()
      .default("pending"),
    refundId: varchar("refund_id", { length: 64 }),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orphan_payments_created_at_idx").on(table.createdAt.desc()),
  ],
);