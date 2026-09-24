// app/api/reservations/[id]/sync/route.ts

import { getSupabase } from "../../../../lib/supabase";
import { getPaymentClient } from "../../../../lib/mercadopago";

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { notifyCouplePayment } from "../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Status do MP que significam "pagamento não vai acontecer". */
const DEAD_STATUSES = ["cancelled", "expired", "rejected", "refunded"];

/** Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago. */
function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  // O formato do header é: ts=123,v1=abc...
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    }),
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  // A string assinada tem o formato documentado pelo MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const expected = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (expected.length !== v1.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

export async function POST(req: Request) {
  let body: { type?: string; data?: { id?: string } };

  try {
    body = await req.json();
  } catch {
    // Sempre 200 para o MP não reenviar em loop
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const xSignature = req.headers.get("x-signature") ?? "";
  const xRequestId = req.headers.get("x-request-id") ?? "";
  const paymentId = body.data?.id;

  if (!paymentId || !xSignature) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!validateSignature(xSignature, xRequestId, paymentId)) {
    console.warn("[webhook] assinatura inválida");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Processa de forma assíncrona — o MP espera resposta em até 22s
  if (body.type === "payment") {
    processPayment(paymentId).catch((err) =>
      console.error("[webhook] processPayment:", err),
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function processPayment(paymentId: string) {
  const supabase = getSupabase();

  // 1. Busca o pagamento no MP
  let payment;
  try {
    payment = await getPaymentClient().get({ id: paymentId });
  } catch (err) {
    console.error(`[webhook] Falha ao buscar pagamento ${paymentId}:`, err);
    return;
  }

  const reservationId = payment.external_reference;
  if (!reservationId) {
    console.warn("[webhook] pagamento sem external_reference");
    return;
  }

  const status = payment.status ?? "unknown";
  const method = payment.payment_method_id ?? null;

  // 2. Busca a reserva — use maybeSingle porque o cron pode tê-la apagado
  const { data: existing } = await supabase
    .from("gift_reservations")
    .select("id, payment_id, payment_status, gift_id")
    .eq("id", reservationId)
    .maybeSingle();

  // ---------------------------------------------------------------------------
  // CASO A: A reserva não existe mais (o cron de 30 min já a removeu)
  // ---------------------------------------------------------------------------
  if (!existing) {
    console.warn(
      `[webhook] Reserva ${reservationId} não existe mais. ` +
        `Pagamento ${paymentId} chegou com status "${status}".`,
    );

    if (status === "approved") {
      console.error(
        `[webhook] ⚠️ PAGAMENTO ÓRFÃO: ${paymentId} aprovado para reserva inexistente.`,
      );
    }

    return;
  }

  // ---------------------------------------------------------------------------
  // CASO B: Idempotência — se já registramos esse payment_id e status, ignora
  // ---------------------------------------------------------------------------
  if (
    existing.payment_id === paymentId &&
    existing.payment_status === status
  ) {
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO C: Pagamento morreu (cancelado, expirado, rejeitado ou reembolsado)
  //         → libera o presente, apagando a reserva
  // ---------------------------------------------------------------------------
  if (DEAD_STATUSES.includes(status)) {
    console.log(
      `[webhook] Pagamento ${paymentId} com status "${status}". ` +
        `Liberando reserva ${reservationId}.`,
    );

    const { error } = await supabase
      .from("gift_reservations")
      .delete()
      .eq("id", reservationId);

    if (error) {
      console.error("[webhook] Falha ao liberar reserva:", error);
    } else {
      console.log(
        `[webhook] Presente ${existing.gift_id} liberado novamente.`,
      );
    }

    return;
  }

  // ---------------------------------------------------------------------------
  // CASO D: Pagamento em processamento (pending, in_process, authorized)
  //         → atualiza o status sem liberar nada
  // ---------------------------------------------------------------------------
  if (
    status === "pending" ||
    status === "in_process" ||
    status === "authorized"
  ) {
    await supabase
      .from("gift_reservations")
      .update({
        payment_id: paymentId,
        payment_status: status,
        payment_method: method,
      })
      .eq("id", reservationId);

    console.log(
      `[webhook] Pagamento ${paymentId} ainda pendente (${status}).`,
    );
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO E: Pagamento aprovado → marca como "paid" e notifica os noivos
  // ---------------------------------------------------------------------------
  if (status === "approved") {
    const { error } = await supabase
      .from("gift_reservations")
      .update({
        status: "paid",
        payment_id: paymentId,
        payment_status: status,
        payment_method: method,
        paid_at: new Date().toISOString(),
      })
      .eq("id", reservationId);

    if (error) {
      console.error("[webhook] Falha ao marcar como pago:", error);
      return;
    }

    const amountCents = payment.transaction_amount
      ? Math.round(payment.transaction_amount * 100)
      : 0;

    await notifyCouplePayment({
      reservationId,
      paymentId,
      amountCents,
      method: method ?? "unknown",
      payerName: payment.payer?.first_name ?? "Convidado",
      payerEmail: payment.payer?.email ?? "",
    }).catch((err) => console.error("[webhook] notify:", err));

    console.log(
      `[webhook] ✅ Pagamento ${paymentId} aprovado. Reserva ${reservationId} marcada como paga.`,
    );
    return;
  }

  // Status desconhecido — apenas loga
  console.warn(
    `[webhook] Pagamento ${paymentId} com status não tratado: "${status}"`,
  );
}