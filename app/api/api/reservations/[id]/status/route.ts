// app/api/reservations/[id]/status/route.ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../../lib/db";
import { giftReservations, gifts } from "../../../../../../lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Retorna o status atual de uma reserva.
 * Usado pela página /presentes/obrigado para polling em tempo real.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // ID vem da URL — valida formato antes de bater no banco
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let data;
  try {
    [data] = await getDb()
      .select({
        id: giftReservations.id,
        status: giftReservations.status,
        paymentStatus: giftReservations.paymentStatus,
        paymentMethod: giftReservations.paymentMethod,
        paidAt: giftReservations.paidAt,
        amountCents: giftReservations.amountCents,
        createdAt: giftReservations.createdAt,
        giftName: gifts.name,
        giftImageUrl: gifts.imageUrl,
      })
      .from(giftReservations)
      .innerJoin(gifts, eq(giftReservations.giftId, gifts.id))
      .where(eq(giftReservations.id, id))
      .limit(1);
  } catch (error) {
    console.error("[status] erro:", error);
    return NextResponse.json(
      { error: "Erro ao consultar." },
      { status: 500 },
    );
  }

  // Reserva não existe mais (cron apagou por expiração)
  if (!data) {
    return NextResponse.json(
      { status: "expired", paymentStatus: null, gift: null },
      { status: 200 },
    );
  }

  return NextResponse.json({
    status: data.status,
    paymentStatus: data.paymentStatus,
    paymentMethod: data.paymentMethod,
    paidAt: data.paidAt,
    amountCents: data.amountCents,
    createdAt: data.createdAt,
    gift: { name: data.giftName, image_url: data.giftImageUrl },
  });
}