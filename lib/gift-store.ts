// lib/gift-store.ts
import "server-only";
import { getSupabase } from "./supabase";
import type { GiftInput } from "./gift-schema";

export type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  externalLink: string;
  position: number;
  active: boolean;
  /** Quantas pessoas já presentearam (só conta as que pagaram). */
  contributorsCount: number;
  /** Nomes de quem já pagou — útil no admin. */
  contributors: string[];
  createdAt: string;
};

type GiftRow = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  external_link: string | null;
  position: number;
  active: boolean;
  created_at: string;
};

type ReservationRow = {
  gift_id: string;
  name: string;
  payment_status: string | null;
};

export async function listGifts(
  opts: { includeInactive?: boolean } = {},
): Promise<Gift[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("gifts")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (!opts.includeInactive) {
    query = query.eq("active", true);
  }

  const { data: gifts, error } = await query;
  if (error) throw new Error(error.message);
  if (!gifts || gifts.length === 0) return [];

  const ids = gifts.map((g) => g.id);

  // Conta apenas quem PAGOU. Reservas pendentes não aparecem no card público.
  const { data: reservations } = await supabase
    .from("gift_reservations")
    .select("gift_id, name, payment_status")
    .in("gift_id", ids)
    .eq("payment_status", "approved");

  const byGift = new Map<string, string[]>();
  for (const r of (reservations ?? []) as ReservationRow[]) {
    const list = byGift.get(r.gift_id) ?? [];
    list.push(r.name);
    byGift.set(r.gift_id, list);
  }

  return (gifts as GiftRow[]).map((g) => {
    const contributors = byGift.get(g.id) ?? [];
    return {
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      imageUrl: g.image_url ?? "",
      priceCents: g.price_cents,
      externalLink: g.external_link ?? "",
      position: g.position,
      active: g.active,
      contributorsCount: contributors.length,
      contributors,
      createdAt: g.created_at,
    };
  });
}

export async function createGift(input: GiftInput): Promise<Gift> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("gifts")
    .insert({
      name: input.name,
      description: input.description || null,
      image_url: input.imageUrl || null,
      price_cents: input.priceCents,
      quota_cents: input.priceCents, // mantém a coluna preenchida, sem usar
      external_link: input.externalLink || null,
      position: input.position ?? 0,
      active: input.active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  const all = await listGifts({ includeInactive: true });
  return all.find((g) => g.id === data.id)!;
}

export async function deleteGift(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleGift(id: string, active: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("gifts")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message);
}