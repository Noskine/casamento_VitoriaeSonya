// app/api/reservations/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabase";

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

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("gift_reservations")
    .select(
      `
      id,
      status,
      payment_status,
      payment_method,
      paid_at,
      amount_cents,
      created_at,
      gift_id,
      gifts:gift_id ( name, image_url )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
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
    paymentStatus: data.payment_status,
    paymentMethod: data.payment_method,
    paidAt: data.paid_at,
    amountCents: data.amount_cents,
    createdAt: data.created_at,
    gift: Array.isArray(data.gifts) ? data.gifts[0] : data.gifts,
  });
}