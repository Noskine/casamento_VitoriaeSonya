// app/api/gifts/[id]/reserve/route.ts
import { NextResponse } from "next/server";
import {
  deleteGiftReservation,
  getGiftById,
  getGiftRaisedCents,
  reserveGift,
} from "../../../../../lib/gift-store";
import { getPreferenceClient } from "../../../../../lib/mercadopago";
import { reservationSchema } from "../../../../../lib/gift-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESERVATION_TTL_MINUTES = 30;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: giftId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 1. Confere o presente e o valor que falta arrecadar.
  let gift;
  let raisedCents: number;
  try {
    gift = await getGiftById(giftId);
    raisedCents = await getGiftRaisedCents(giftId);
  } catch (error) {
    console.error("[reserve] consulta do presente:", error);
    return NextResponse.json(
      { error: "Não foi possível reservar." },
      { status: 500 },
    );
  }

  if (!gift) {
    return NextResponse.json(
      { error: "Presente não encontrado." },
      { status: 404 },
    );
  }

  if (!gift.active) {
    return NextResponse.json(
      { error: "Este presente não está mais disponível." },
      { status: 409 },
    );
  }

  if (parsed.data.contributionCents > gift.priceCents - raisedCents) {
    return NextResponse.json(
      { error: "A contribuição excede o valor que falta arrecadar." },
      { status: 409 },
    );
  }

  // 2. Registra a contribuição parcial escolhida pela pessoa.
  let reservation: { ok: true; reservationId: string };
  try {
    reservation = await reserveGift(giftId, parsed.data);
  } catch (error) {
    console.error("[reserve] criação da reserva:", error);
    return NextResponse.json(
      { error: "Não foi possível reservar." },
      { status: 500 },
    );
  }
  // 3. Cria a preferência no Mercado Pago
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const expiration = new Date(
    Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  try {
    const preference = await getPreferenceClient().create({
      body: {
        items: [
          {
            id: gift.id,
            title: `Presente: ${gift.name}`,
            description: `Presente de ${parsed.data.name} para o casamento`,
            quantity: 1,
            unit_price: parsed.data.contributionCents / 100,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: parsed.data.name,
          email: parsed.data.email,
        },
        external_reference: reservation.reservationId,
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}/presentes/obrigado?status=approved&rid=${reservation.reservationId}`,
          pending: `${siteUrl}/presentes/obrigado?status=pending&rid=${reservation.reservationId}`,
          failure: `${siteUrl}/presentes/obrigado?status=rejected&rid=${reservation.reservationId}`,
        },
        auto_return: "approved",
        statement_descriptor: "CASAMENTO VITORIA SONYA",
        payment_methods: { installments: 12 },
        date_of_expiration: expiration,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        reservationId: reservation.reservationId,
        amountCents: parsed.data.contributionCents,
        expiresAt: expiration,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[reserve] MP preference:", err);

    await deleteGiftReservation(reservation.reservationId);

    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento." },
      { status: 500 },
    );
  }
}