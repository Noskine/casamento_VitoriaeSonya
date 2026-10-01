// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../lib/db";
import { giftReservations, orphanPayments } from "../../../../lib/db/schema";
import { getPaymentClient, getRefundClient } from "../../../../lib/mercadopago";

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
  const db = getDb();

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
  const amountCents = payment.transaction_amount
    ? Math.round(payment.transaction_amount * 100)
    : 0;
  const payerName = payment.payer?.first_name ?? null;
  const payerEmail = payment.payer?.email ?? null;

  const [existing] = await db
    .select({
      id: giftReservations.id,
      paymentId: giftReservations.paymentId,
      paymentStatus: giftReservations.paymentStatus,
      giftId: giftReservations.giftId,
    })
    .from(giftReservations)
    .where(eq(giftReservations.id, reservationId))
    .limit(1);

  // ---------------------------------------------------------------------------
  // CASO A: Reserva não existe mais (cron de 30 min já removeu)
  // ---------------------------------------------------------------------------
  if (!existing) {
    await handleOrphanPayment({
      paymentId,
      reservationId,
      status,
      method,
      amountCents,
      payerName,
      payerEmail,
      rawPayment: payment,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO B: Idempotência
  // ---------------------------------------------------------------------------
  if (
    existing.paymentId === paymentId &&
    existing.paymentStatus === status
  ) {
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO C: Pagamento morreu → libera o presente
  // ---------------------------------------------------------------------------
  if (DEAD_STATUSES.includes(status)) {
    console.log(
      `[webhook] Pagamento ${paymentId} com status "${status}". ` +
        `Liberando reserva ${reservationId}.`,
    );

    try {
      await db
        .delete(giftReservations)
        .where(eq(giftReservations.id, reservationId));
      console.log(
        `[webhook] Presente ${existing.giftId} liberado novamente.`,
      );
    } catch (error) {
      console.error("[webhook] Falha ao liberar reserva:", error);
    }
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO D: Pagamento pendente
  // ---------------------------------------------------------------------------
  if (
    status === "pending" ||
    status === "in_process" ||
    status === "authorized"
  ) {
    await db
      .update(giftReservations)
      .set({
        paymentId,
        paymentStatus: status,
        paymentMethod: method,
      })
      .where(eq(giftReservations.id, reservationId));

    console.log(`[webhook] Pagamento ${paymentId} ainda pendente (${status}).`);
    return;
  }

  // ---------------------------------------------------------------------------
  // CASO E: Pagamento aprovado
  // ---------------------------------------------------------------------------
  if (status === "approved") {
    try {
      await db
        .update(giftReservations)
        .set({
          status: "paid",
          paymentId,
          paymentStatus: status,
          paymentMethod: method,
          paidAt: new Date().toISOString(),
        })
        .where(eq(giftReservations.id, reservationId));
    } catch (error) {
      console.error("[webhook] Falha ao marcar como pago:", error);
      return;
    }

    console.log(
      `[webhook] ✅ Pagamento ${paymentId} aprovado. Reserva ${reservationId} paga.`,
    );
    return;
  }

  console.warn(
    `[webhook] Pagamento ${paymentId} com status não tratado: "${status}"`,
  );
}

/* -------------------------------------------------------------------------- */
/*  Pagamento órfão — sem e-mail, só banco + log                               */
/* -------------------------------------------------------------------------- */

async function handleOrphanPayment({
  paymentId,
  reservationId,
  status,
  method,
  amountCents,
  payerName,
  payerEmail,
  rawPayment,
}: {
  paymentId: string;
  reservationId: string;
  status: string;
  method: string | null;
  amountCents: number;
  payerName: string | null;
  payerEmail: string | null;
  rawPayment: unknown;
}) {
  const db = getDb();

  console.warn(
    `[webhook] Reserva ${reservationId} não existe mais. ` +
      `Pagamento ${paymentId} chegou com status "${status}".`,
  );

  if (status !== "approved") return;

  console.error(
    `[webhook] ⚠️ PAGAMENTO ÓRFÃO: ${paymentId} aprovado para reserva inexistente. ` +
      `Valor: R$ ${(amountCents / 100).toFixed(2)}.`,
  );

  // Reserve the payment ID before refunding so duplicate webhooks cannot refund twice.
  const rawPayload =
    typeof rawPayment === "object" && rawPayment !== null
      ? (rawPayment as Record<string, unknown>)
      : { value: rawPayment };
  const [orphan] = await db
    .insert(orphanPayments)
    .values({
      paymentId,
      reservationId,
      amountCents,
      method,
      payerName,
      payerEmail,
      refundStatus: "pending",
      rawPayload,
    })
    .onConflictDoNothing({ target: orphanPayments.paymentId })
    .returning({ id: orphanPayments.id });

  if (!orphan) {
    console.log(`[webhook] Órfão ${paymentId} já registrado.`);
    return;
  }

  // 2. Tenta reembolsar automaticamente
  let refundStatus: "refunded" | "failed" | "pending" = "pending";
  let refundId: string | null = null;

  try {
    const refund = await getRefundClient().create({
      payment_id: paymentId,
    });

    refundId = refund.id ? String(refund.id) : null;

    if (refund.status === "approved" || refund.status === "refunded") {
      refundStatus = "refunded";
      console.log(
        `[webhook] ✅ Reembolso automático OK para ${paymentId}. Refund ID: ${refundId}`,
      );
    } else {
      refundStatus = "pending";
      console.warn(
        `[webhook] Reembolso de ${paymentId} retornou status "${refund.status}".`,
      );
    }
  } catch (err) {
    refundStatus = "failed";
    console.error(
      `[webhook] ❌ Falha no reembolso automático de ${paymentId}:`,
      err,
    );
  }

  try {
    await db
      .update(orphanPayments)
      .set({
        refundStatus,
        refundId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orphanPayments.id, orphan.id));
  } catch (error) {
    console.error("[webhook] Falha ao atualizar o estado do órfão:", error);
  }
}