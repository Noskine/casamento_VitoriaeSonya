// app/api/reservations/[id]/sync/route.ts
import { NextResponse } from "next/server";
import { getSupabase } from "../../../../lib/supabase";
import { getPaymentClient } from "../../../../lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Força uma consulta ao Mercado Pago e atualiza a reserva.
 * Útil quando o webhook atrasou ou falhou.
 */
export async function POST(req: Request) {
  const { id } = await params;

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  const supabase = getSupabase();

  // 1. Busca a reserva
  const { data: reservation, error: resErr } = await supabase
    .from("gift_reservations")
    .select("id, payment_id, payment_status, status")
    .eq("id", id)
    .maybeSingle();

  if (resErr) {
    console.error("[sync] erro:", resErr);
    return NextResponse.json({ error: "Erro ao consultar." }, { status: 500 });
  }

  if (!reservation) {
    return NextResponse.json(
      { status: "expired", message: "Reserva não existe mais." },
      { status: 200 },
    );
  }

  // Se já temos um payment_id, consulta o MP
  if (reservation.payment_id) {
    try {
      const payment = await getPaymentClient().get({
        id: reservation.payment_id,
      });

      const newStatus = payment.status ?? "unknown";
      const method = payment.payment_method_id ?? null;

      // Atualiza o banco
      const update: Record<string, unknown> = {
        payment_status: newStatus,
        payment_method: method,
      };

      if (newStatus === "approved") {
        update.status = "paid";
        update.paid_at = new Date().toISOString();
      }

      await supabase
        .from("gift_reservations")
        .update(update)
        .eq("id", id);

      return NextResponse.json({
        status: newStatus === "approved" ? "paid" : reservation.status,
        paymentStatus: newStatus,
        synced: true,
      });
    } catch (err) {
      console.error("[sync] MP lookup falhou:", err);
      return NextResponse.json(
        { error: "Não foi possível consultar o Mercado Pago." },
        { status: 502 },
      );
    }
  }

  // Sem payment_id: a pessoa pode não ter concluído o checkout
  return NextResponse.json({
    status: reservation.status,
    paymentStatus: reservation.payment_status,
    synced: false,
    message: "Nenhum pagamento associado ainda.",
  });
}