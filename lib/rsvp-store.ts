// lib/rsvp-store.ts
import "server-only";
import { createHash } from "node:crypto";
import { getSupabase } from "./supabase";
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

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  attending: "yes" | "no";
  guests: number;
  guest_names: string | null;
  diet: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
};

function toStored(r: Row): StoredRsvp {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    attending: r.attending,
    guests: r.guests,
    guestNames: r.guest_names ?? "",
    diet: r.diet ?? "",
    message: r.message ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function saveRsvp(
  input: RsvpInput,
  meta: SaveMeta = {},
): Promise<StoredRsvp> {
  const supabase = getSupabase(); // ← aqui

  const { data, error } = await supabase
    .from("rsvps")
    .upsert(
      {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        attending: input.attending,
        guests: input.guests,
        guest_names: input.guestNames || null,
        diet: input.diet || null,
        message: input.message || null,
        ip_hash: meta.ip ? hashIp(meta.ip) : null,
        user_agent: meta.userAgent?.slice(0, 300) ?? null,
      },
      { onConflict: "email" },
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toStored(data as Row);
}

export async function listRsvps(): Promise<StoredRsvp[]> {
  const supabase = getSupabase(); // ← aqui

  const { data, error } = await supabase
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Row[]).map(toStored);
}