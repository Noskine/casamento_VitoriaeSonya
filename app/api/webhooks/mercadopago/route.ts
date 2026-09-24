// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabase } from "../../../../lib/supabase";
import { getPaymentClient } from "../../../../lib/mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEAD_STATUSES = ["cancelled", "expired", "rejected", "refunded"];

function validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    }),
  );

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

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

  if (body.type === "payment") {
    processPayment(paymentId).catch((err) =>
      console.error("[webhook] processPayment:", err),
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function processPayment(paymentId: string) {
  const supabase = getSupabase();

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

  const { data: existing } = await supabase
    .from("gift_reservations")
    .select("id, payment_id, payment_status, gift_id")
    .eq("id", reservationId)
    .maybeSingle();

  // CASO A: Reserva já foi apagada pelo cron
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

  // CASO B: Idempotência
  if (
    existing.payment_id === paymentId &&
    existing.payment_status === status
  ) {
    return;
  }

  // CASO C: Pagamento morreu → libera o presente
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

  // CASO D: Pagamento em processamento
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

    console.log(`[webhook] Pagamento ${paymentId} ainda pendente (${status}).`);
    return;
  }

  // CASO E: Pagamento aprovado
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

    console.log(
      `[webhook] ✅ Pagamento ${paymentId} aprovado. Reserva ${reservationId} marcada como paga.`,
    );
    return;
  }

  console.warn(
    `[webhook] Pagamento ${paymentId} com status não tratado: "${status}"`,
  );
}