import "server-only";
import { getSupabase } from "./supabase";
import type { GiftInput, ReservationInput } from "./gift-schema";

export type Gift = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  externalLink: string;
  position: number;
  active: boolean;
  reservedBy: string | null;
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
  status: string;
};

/** Lista presentes ativos com info de reserva embutida. */
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
  const { data: reservations } = await supabase
    .from("gift_reservations")
    .select("gift_id, name, status")
    .in("gift_id", ids)
    .in("status", ["reserved", "paid"]);

  const map = new Map<string, string>();
  for (const r of (reservations ?? []) as ReservationRow[]) {
    map.set(r.gift_id, r.name);
  }

  return (gifts as GiftRow[]).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    imageUrl: g.image_url ?? "",
    priceCents: g.price_cents,
    externalLink: g.external_link ?? "",
    position: g.position,
    active: g.active,
    reservedBy: map.get(g.id) ?? null,
    createdAt: g.created_at,
  }));
}

/** Cria um presente (admin). */
export async function createGift(input: GiftInput): Promise<Gift> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("gifts")
    .insert({
      name: input.name,
      description: input.description || null,
      image_url: input.imageUrl || null,
      price_cents: input.priceCents,
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

/** Remove um presente (admin). */
export async function deleteGift(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("gifts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Alterna ativo/inativo. */
export async function toggleGift(id: string, active: boolean): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("gifts")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Reserva um presente. */
export async function reserveGift(
  giftId: string,
  input: ReservationInput,
): Promise<{ ok: true }> {
  const supabase = getSupabase();

  // Confere se o presente existe e ainda está disponível
  const { data: gift, error: giftErr } = await supabase
    .from("gifts")
    .select("id, active")
    .eq("id", giftId)
    .single();

  if (giftErr || !gift) throw new Error("Presente não encontrado.");
  if (!gift.active) throw new Error("Este presente não está mais disponível.");

  const { error } = await supabase.from("gift_reservations").insert({
    gift_id: giftId,
    name: input.name,
    email: input.email,
    message: input.message || null,
    status: "reserved",
  });

  if (error) {
    // Conflito do índice único = alguém reservou antes
    if (error.code === "23505") {
      throw new Error("Alguém acabou de reservar este presente.");
    }
    throw new Error(error.message);
  }

  return { ok: true };
}