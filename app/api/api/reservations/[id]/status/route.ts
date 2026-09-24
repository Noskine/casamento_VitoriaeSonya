// app/api/reservations/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../../lib/supabase";

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

  // Reserva não existe mais (cron apagou por expiração)
  if (!data) {
    return NextResponse.json(
      { status: "expired", paymentStatus: null, gift: null },
      { status: 200 },
    );
  }

  return NextResponse.json({
    status: data.status, // "reserved" | "paid" | "cancelled"
    paymentStatus: data.payment_status, // "pending" | "approved" | "rejected" | ...
    paymentMethod: data.payment_method,
    paidAt: data.paid_at,
    amountCents: data.amount_cents,
    createdAt: data.created_at,
    gift: Array.isArray(data.gifts) ? data.gifts[0] : data.gifts,
  });
}