// lib/orphan-store.ts
import "server-only";
import { getSupabase } from "./supabase";

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

type Row = {
  id: string;
  payment_id: string;
  reservation_id: string | null;
  amount_cents: number;
  method: string | null;
  payer_name: string | null;
  payer_email: string | null;
  refund_status: "pending" | "refunded" | "failed" | "manual";
  refund_id: string | null;
  created_at: string;
};

function toOrphan(r: Row): OrphanPayment {
  return {
    id: r.id,
    paymentId: r.payment_id,
    reservationId: r.reservation_id,
    amountCents: r.amount_cents,
    method: r.method,
    payerName: r.payer_name,
    payerEmail: r.payer_email,
    refundStatus: r.refund_status,
    refundId: r.refund_id,
    createdAt: r.created_at,
  };
}

export async function listOrphanPayments(): Promise<OrphanPayment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("orphan_payments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as Row[]).map(toOrphan);
}

/** Marca manualmente um órfão como resolvido (admin libera). */
export async function markOrphanResolved(
  id: string,
  status: "manual" | "refunded",
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("orphan_payments")
    .update({ refund_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}