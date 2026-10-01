// app/api/reservations/[id]/status/route.ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../lib/db";
import { giftReservations, gifts } from "../../../../../lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  // ---------------------------------------------------------------------------
  // Reserva não existe mais. Pode ser que:
  //   a) O cron apagou (pagamento nunca feito)
  //   b) O cron apagou, mas o pagamento foi aprovado depois
  // ---------------------------------------------------------------------------
  if (!data) {
    try {
      const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${id}&sort=date_created&criteria=desc`;

      const res = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
        cache: "no-store",
      });

      if (res.ok) {
        const body = await res.json();
        const results = body?.results ?? [];

        if (results.length > 0) {
          const latest = results[0];
          const paymentStatus = latest.status ?? null;

          // Se aprovado, retorna como pago mesmo sem a reserva no banco
          if (paymentStatus === "approved") {
            return NextResponse.json({
              status: "paid",
              paymentStatus: "approved",
              paymentMethod: latest.payment_method_id ?? null,
              paidAt: latest.date_approved ?? null,
              amountCents: latest.transaction_amount
                ? Math.round(latest.transaction_amount * 100)
                : null,
              gift: null, // reserva foi apagada, não temos o gift
            });
          }

          // Se pendente, retorna como pendente
          if (
            paymentStatus === "pending" ||
            paymentStatus === "in_process"
          ) {
            return NextResponse.json({
              status: "reserved",
              paymentStatus,
              paymentMethod: latest.payment_method_id ?? null,
              paidAt: null,
              amountCents: latest.transaction_amount
                ? Math.round(latest.transaction_amount * 100)
                : null,
              gift: null,
            });
          }
        }
      }
    } catch (err) {
      console.error("[status] busca por external_reference falhou:", err);
    }

    // Fallback: reserva expirou e não tem pagamento
    return NextResponse.json(
      { status: "expired", paymentStatus: null, gift: null },
      { status: 200 },
    );
  }

  // ---------------------------------------------------------------------------
  // Reserva existe — retorna os dados normalmente
  // ---------------------------------------------------------------------------
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