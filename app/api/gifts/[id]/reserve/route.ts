// app/api/gifts/[id]/reserve/route.ts
import { NextResponse } from "next/server";
import { getSupabase } from "../../../../../lib/supabase";
import { getPreferenceClient } from "../../../../../lib/mercadopago";
import { reservationSchema } from "../../../../../lib/gift-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minutos que a reserva fica ativa até o pagamento ser concluído. */
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

  const supabase = getSupabase();

  // 1. Busca o presente
  const { data: gift, error: giftErr } = await supabase
    .from("gifts")
    .select("id, name, price_cents, active")
    .eq("id", giftId)
    .single();

  if (giftErr || !gift) {
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

  // 2. Cria a reserva com status inicial "pending"
  const { data: reservation, error: resErr } = await supabase
    .from("gift_reservations")
    .insert({
      gift_id: giftId,
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message || null,
      status: "reserved",
      payment_status: "pending",
      amount_cents: gift.price_cents,
    })
    .select()
    .single();

  if (resErr) {
    if (resErr.code === "23505") {
      return NextResponse.json(
        { error: "Alguém acabou de reservar este presente." },
        { status: 409 },
      );
    }
    console.error("[reserve]", resErr);
    return NextResponse.json(
      { error: "Não foi possível reservar." },
      { status: 500 },
    );
  }

  // 3. Cria a preferência de pagamento no Mercado Pago
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Calcula a data de expiração da preferência (mesmo prazo da reserva)
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
            description: `Reserva de ${parsed.data.name} para o casamento`,
            quantity: 1,
            unit_price: gift.price_cents / 100,
            currency_id: "BRL",
          },
        ],
        payer: {
          name: parsed.data.name,
          email: parsed.data.email,
        },
        // Vincula a preferência à reserva — o webhook usa isso pra achar a linha
        external_reference: reservation.id,
        // Onde o MP avisa quando o pagamento mudar de status
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${siteUrl}/presentes/obrigado?status=approved&rid=${reservation.id}`,
          pending: `${siteUrl}/presentes/obrigado?status=pending&rid=${reservation.id}`,
          failure: `${siteUrl}/presentes/obrigado?status=rejected&rid=${reservation.id}`,
        },
        auto_return: "approved",
        statement_descriptor: "CASAMENTO VITORIA SONYA",
        // Habilita Pix + cartão + boleto (padrão do MP já inclui todos)
        payment_methods: {
          installments: 12,
        },
        // ⏳ A preferência expira junto com a reserva (30 minutos)
        date_of_expiration: expiration,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        reservationId: reservation.id,
        expiresAt: expiration,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[reserve] MP preference:", err);

    // Se a preferência falhar, apaga a reserva pra não travar o presente
    await supabase.from("gift_reservations").delete().eq("id", reservation.id);

    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento." },
      { status: 500 },
    );
  }
}