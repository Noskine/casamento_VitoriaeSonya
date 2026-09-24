// lib/gift-store.ts
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
  /** Nome do primeiro contribuinte (compatibilidade retroativa). */
  reservedBy: string | null;
  /** Todos os contribuintes confirmados. */
  contributors: string[];
  /** Total arrecadado (em centavos), só de pagamentos aprovados. */
  raisedCents: number;
  /** Quantos contribuíram (só aprovados). */
  contributorsCount: number;
  /** Total de reservas ativas (aprovadas ou pendentes). */
  activeReservations: number;
  /** Se o valor total já foi atingido. */
  isComplete: boolean;
  /** Progresso de 0 a 100 (baseado no valor arrecadado). */
  progress: number;
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
  payment_status: string | null;
  contribution_cents: number | null;
  created_at: string;
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

  // Busca TODAS as reservas ativas (aprovadas e pendentes) para calcular
  const { data: reservations } = await supabase
    .from("gift_reservations")
    .select(
      "gift_id, name, status, payment_status, contribution_cents, created_at",
    )
    .in("gift_id", ids)
    .in("status", ["reserved", "paid"]);

  // Agrupa por gift_id
  const map = new Map<
    string,
    { names: string[]; raised: number; active: number }
  >();

  for (const r of (reservations ?? []) as ReservationRow[]) {
    const current = map.get(r.gift_id) ?? {
      names: [],
      raised: 0,
      active: 0,
    };

    // Conta toda reserva ativa (pendente ou paga)
    current.active += 1;

    // Só soma o valor das contribuições aprovadas
    if (r.payment_status === "approved") {
      current.names.push(r.name);
      current.raised += r.contribution_cents ?? 0;
    }

    map.set(r.gift_id, current);
  }

  return (gifts as GiftRow[]).map((g) => {
    const agg = map.get(g.id);

    // Fallback: se a reserva foi criada antes do campo contribution_cents
    // existir, assume o preço total do presente
    const raised = agg?.raised ?? 0;
    const isComplete = raised >= g.price_cents && g.price_cents > 0;

    const progress =
      g.price_cents > 0
        ? Math.min(100, Math.round((raised / g.price_cents) * 100))
        : 0;

    return {
      id: g.id,
      name: g.name,
      description: g.description ?? "",
      imageUrl: g.image_url ?? "",
      priceCents: g.price_cents,
      externalLink: g.external_link ?? "",
      position: g.position,
      active: g.active,
      reservedBy: agg?.names[0] ?? null,
      contributors: agg?.names ?? [],
      raisedCents: raised,
      contributorsCount: agg?.names.length ?? 0,
      activeReservations: agg?.active ?? 0,
      isComplete,
      progress,
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

/** Reserva um presente com valor de contribuição (vaquinha). */
export async function reserveGift(
  giftId: string,
  input: ReservationInput & { contributionCents: number },
): Promise<{ ok: true; reservationId: string }> {
  const supabase = getSupabase();

  const { data: gift, error: giftErr } = await supabase
    .from("gifts")
    .select("id, active, price_cents")
    .eq("id", giftId)
    .single();

  if (giftErr || !gift) throw new Error("Presente não encontrado.");
  if (!gift.active) throw new Error("Este presente não está mais disponível.");

  const { data, error } = await supabase
    .from("gift_reservations")
    .insert({
      gift_id: giftId,
      name: input.name,
      email: input.email,
      message: input.message || null,
      status: "reserved",
      payment_status: "pending",
      contribution_cents: input.contributionCents,
      amount_cents: input.contributionCents,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return { ok: true, reservationId: data.id };
}

export async function getGiftById(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("gifts")
    .select("id, name, price_cents, active")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as {
    id: string;
    name: string;
    price_cents: number;
    active: boolean;
  };
}

/** Calcula quanto já foi arrecadado para um presente específico. */
export async function getGiftRaisedCents(giftId: string): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("gift_reservations")
    .select("contribution_cents")
    .eq("gift_id", giftId)
    .eq("payment_status", "approved");

  return (data ?? []).reduce(
    (sum, r) => sum + (r.contribution_cents ?? 0),
    0,
  );
}