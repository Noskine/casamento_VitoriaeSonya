// lib/gift-store.ts
import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { giftReservations, gifts as giftsTable } from "./db/schema";
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

export async function listGifts(
  opts: { includeInactive?: boolean } = {},
): Promise<Gift[]> {
  const db = getDb();
  const gifts = await db
    .select()
    .from(giftsTable)
    .where(opts.includeInactive ? undefined : eq(giftsTable.active, true))
    .orderBy(asc(giftsTable.position), asc(giftsTable.createdAt));

  if (gifts.length === 0) return [];

  const ids = gifts.map((gift) => gift.id);
  const reservations = await db
    .select({
      giftId: giftReservations.giftId,
      name: giftReservations.name,
      status: giftReservations.status,
      paymentStatus: giftReservations.paymentStatus,
      contributionCents: giftReservations.contributionCents,
      amountCents: giftReservations.amountCents,
    })
    .from(giftReservations)
    .where(
      and(
        inArray(giftReservations.giftId, ids),
        inArray(giftReservations.status, ["reserved", "paid"]),
      ),
    );

  const byGift = new Map<
    string,
    { names: string[]; raised: number; active: number }
  >();
  for (const reservation of reservations) {
    const current = byGift.get(reservation.giftId) ?? {
      names: [],
      raised: 0,
      active: 0,
    };
    current.active += 1;
    if (reservation.paymentStatus === "approved") {
      current.names.push(reservation.name);
      current.raised +=
        reservation.contributionCents ?? reservation.amountCents ?? 0;
    }
    byGift.set(reservation.giftId, current);
  }

  return gifts.map((gift) => {
    const aggregate = byGift.get(gift.id);
    const raised = aggregate?.raised ?? 0;
    const isComplete = raised >= gift.priceCents && gift.priceCents > 0;
    const progress =
      gift.priceCents > 0
        ? Math.min(100, Math.round((raised / gift.priceCents) * 100))
        : 0;

    return {
      id: gift.id,
      name: gift.name,
      description: gift.description ?? "",
      imageUrl: gift.imageUrl ?? "",
      priceCents: gift.priceCents,
      externalLink: gift.externalLink ?? "",
      position: gift.position,
      active: gift.active,
      reservedBy: aggregate?.names[0] ?? null,
      contributors: aggregate?.names ?? [],
      raisedCents: raised,
      contributorsCount: aggregate?.names.length ?? 0,
      activeReservations: aggregate?.active ?? 0,
      isComplete,
      progress,
      createdAt: gift.createdAt,
    };
  });
}

export async function createGift(input: GiftInput): Promise<Gift> {
  const db = getDb();
  const [created] = await db
    .insert(giftsTable)
    .values({
      name: input.name,
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      priceCents: input.priceCents,
      quotaCents: input.priceCents,
      externalLink: input.externalLink || null,
      position: input.position ?? 0,
      active: input.active ?? true,
    })
    .returning({ id: giftsTable.id });

  if (!created) throw new Error("Não foi possível criar o presente.");

  const all = await listGifts({ includeInactive: true });
  const gift = all.find((item) => item.id === created.id);
  if (!gift) throw new Error("Presente criado, mas não foi possível carregá-lo.");
  return gift;
}

export async function deleteGift(id: string): Promise<void> {
  await getDb().delete(giftsTable).where(eq(giftsTable.id, id));
}

export async function toggleGift(id: string, active: boolean): Promise<void> {
  await getDb()
    .update(giftsTable)
    .set({ active, updatedAt: new Date().toISOString() })
    .where(eq(giftsTable.id, id));
}

/** Cria uma reserva com o valor parcial escolhido pela pessoa. */
export async function reserveGift(
  giftId: string,
  input: ReservationInput,
): Promise<{ ok: true; reservationId: string }> {
  const db = getDb();
  const [gift] = await db
    .select({ active: giftsTable.active })
    .from(giftsTable)
    .where(eq(giftsTable.id, giftId))
    .limit(1);

  if (!gift) throw new Error("Presente não encontrado.");
  if (!gift.active) throw new Error("Este presente não está mais disponível.");

  const [reservation] = await db
    .insert(giftReservations)
    .values({
      giftId,
      name: input.name,
      email: input.email,
      message: input.message || null,
      contributionCents: input.contributionCents,
      amountCents: input.contributionCents,
      status: "reserved",
      paymentStatus: "pending",
    })
    .returning({ id: giftReservations.id });

  if (!reservation) throw new Error("Não foi possível criar a reserva.");
  return { ok: true, reservationId: reservation.id };
}

export async function deleteGiftReservation(id: string): Promise<void> {
  await getDb()
    .delete(giftReservations)
    .where(eq(giftReservations.id, id));
}

export async function getGiftById(id: string) {
  const [gift] = await getDb()
    .select({
      id: giftsTable.id,
      name: giftsTable.name,
      priceCents: giftsTable.priceCents,
      active: giftsTable.active,
    })
    .from(giftsTable)
    .where(eq(giftsTable.id, id))
    .limit(1);

  return gift ?? null;
}

export async function getGiftRaisedCents(giftId: string): Promise<number> {
  const reservations = await getDb()
    .select({
      contributionCents: giftReservations.contributionCents,
      amountCents: giftReservations.amountCents,
    })
    .from(giftReservations)
    .where(
      and(
        eq(giftReservations.giftId, giftId),
        eq(giftReservations.paymentStatus, "approved"),
      ),
    );

  return reservations.reduce(
    (sum, reservation) =>
      sum + (reservation.contributionCents ?? reservation.amountCents ?? 0),
    0,
  );
}