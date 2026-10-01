// lib/orphan-store.ts
import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { orphanPayments } from "./db/schema";

export type OrphanPayment = {
  id: string;
  paymentId: string;
  reservationId: string | null;
  amountCents: number;
  method: string | null;
  payerName: string | null;
  payerEmail: string | null;
  refundStatus: "pending" | "refunded" | "failed" | "manual";
  refundId: string | null;
  createdAt: string;
};

function toOrphan(r: typeof orphanPayments.$inferSelect): OrphanPayment {
  return {
    id: r.id,
    paymentId: r.paymentId,
    reservationId: r.reservationId,
    amountCents: r.amountCents,
    method: r.method,
    payerName: r.payerName,
    payerEmail: r.payerEmail,
    refundStatus: r.refundStatus,
    refundId: r.refundId,
    createdAt: r.createdAt,
  };
}

export async function listOrphanPayments(): Promise<OrphanPayment[]> {
  const rows = await getDb()
    .select()
    .from(orphanPayments)
    .orderBy(desc(orphanPayments.createdAt));
  return rows.map(toOrphan);
}

/** Marca manualmente um órfão como resolvido (admin libera). */
export async function markOrphanResolved(
  id: string,
  status: "manual" | "refunded",
): Promise<void> {
  await getDb()
    .update(orphanPayments)
    .set({ refundStatus: status, updatedAt: new Date().toISOString() })
    .where(eq(orphanPayments.id, id));
}