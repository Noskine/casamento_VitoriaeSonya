// lib/rsvp-store.ts
import "server-only";
import { createHash } from "node:crypto";
import { desc } from "drizzle-orm";
import { getDb } from "./db";
import { rsvps } from "./db/schema";
import type { RsvpInput } from "./rsvp-schema";

export type StoredRsvp = RsvpInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveMeta = { ip?: string; userAgent?: string };

function hashIp(ip: string) {
  return createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "rsvp"))
    .digest("hex")
    .slice(0, 64);
}

function toStored(r: typeof rsvps.$inferSelect): StoredRsvp {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    attending: r.attending,
    guests: r.guests,
    guestNames: r.guestNames ?? "",
    diet: r.diet ?? "",
    message: r.message ?? "",
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function saveRsvp(
  input: RsvpInput,
  meta: SaveMeta = {},
): Promise<StoredRsvp> {
  const [row] = await getDb()
    .insert(rsvps)
    .values({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        attending: input.attending,
        guests: input.guests,
        guestNames: input.guestNames || null,
        diet: input.diet || null,
        message: input.message || null,
        ipHash: meta.ip ? hashIp(meta.ip) : null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
      })
    .onConflictDoUpdate({
      target: rsvps.email,
      set: {
        name: input.name,
        phone: input.phone || null,
        attending: input.attending,
        guests: input.guests,
        guestNames: input.guestNames || null,
        diet: input.diet || null,
        message: input.message || null,
        ipHash: meta.ip ? hashIp(meta.ip) : null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning();

  if (!row) throw new Error("Não foi possível salvar a confirmação.");
  return toStored(row);
}

export async function listRsvps(): Promise<StoredRsvp[]> {
  const rows = await getDb().select().from(rsvps).orderBy(desc(rsvps.createdAt));
  return rows.map(toStored);
}