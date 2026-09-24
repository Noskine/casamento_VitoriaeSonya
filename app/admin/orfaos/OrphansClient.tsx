// app/admin/orfaos/OrphansClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Ornament from "../../components/Ornament";
import { formatBRL } from "../../../lib/gift-schema";
import type { OrphanPayment } from "../../../lib/orphan-store";

const EASE = [0.22, 1, 0.36, 1] as const;

const STATUS_LABEL: Record<OrphanPayment["refundStatus"], string> = {
  refunded: "Reembolsado",
  failed: "Falha no reembolso",
  pending: "Processando",
  manual: "Resolvido manualmente",
};

const STATUS_COLOR: Record<OrphanPayment["refundStatus"], string> = {
  refunded: "border-green-500/20 bg-green-500/[0.06] text-green-700",
  failed: "border-red-500/20 bg-red-500/[0.06] text-red-700",
  pending: "border-amber-500/20 bg-amber-500/[0.06] text-amber-700",
  manual: "border-ink/15 bg-ink/[0.04] text-ink/60",
};

export default function OrphansClient({
  initialOrphans,
}: {
  initialOrphans: OrphanPayment[];
}) {
  const [orphans, setOrphans] = useState(initialOrphans);
  const [filter, setFilter] = useState<"all" | "pending" | "failed">("all");

  const filtered = orphans.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return o.refundStatus === "pending";
    return o.refundStatus === "failed";
  });

  const pendingCount = orphans.filter(
    (o) => o.refundStatus === "pending" || o.refundStatus === "failed",
  ).length;

  async function resolve(id: string, status: "manual" | "refunded") {
    if (!confirm("Marcar como resolvido?")) return;

    const res = await fetch(`/api/admin/orphans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setOrphans((prev) =>
        prev.map((o) => (o.id === id ? { ...o, refundStatus: status } : o)),
      );
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/45 transition-colors hover:text-gold"
            >
              ← Painel
            </Link>
          </div>

          <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">
            Pagamentos órfãos
          </h1>
          <Ornament className="mt-5 !justify-start" />

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/55">
            Pagamentos que chegaram depois da reserva ter expirado. O valor foi
            recebido na conta do Mercado Pago, mas o presente já havia sido
            liberado. Quando possível, o reembolso é feito automaticamente.
          </p>

          {pendingCount > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/[0.08] px-4 py-2 text-[0.62rem] uppercase tracking-[0.3em] text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              {pendingCount}{" "}
              {pendingCount === 1 ? "precisa de atenção" : "precisam de atenção"}
            </div>
          )}
        </motion.header>

        {/* Filtros */}
        <div className="mt-10 flex gap-1 rounded-full border border-ink/10 bg-cream p-1 sm:w-fit">
          {(
            [
              { value: "all", label: `Todos (${orphans.length})` },
              { value: "pending", label: "Pendentes" },
              { value: "failed", label: "Falhas" },
            ] as const
          ).map((opt) => {
            const active = filter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`relative rounded-full px-5 py-2 text-[0.62rem] uppercase tracking-[0.25em] transition-colors ${
                  active ? "text-cream" : "text-ink/50 hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="orphan-filter"
                    className="absolute inset-0 rounded-full bg-gold"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lista */}
        <div className="mt-8 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-2xl text-ink/40">
                {orphans.length === 0
                  ? "Nenhum pagamento órfão. Tudo em ordem. ✨"
                  : "Nenhum resultado com esse filtro."}
              </p>
            </div>
          ) : (
            filtered.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4) }}
                className="rounded-2xl border border-ink/[0.07] bg-cream px-5 py-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <p className="font-display text-xl tabular-nums text-gold">
                        {formatBRL(o.amountCents)}
                      </p>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-[0.25em] ${STATUS_COLOR[o.refundStatus]}`}
                      >
                        {STATUS_LABEL[o.refundStatus]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-ink/70">
                      {o.payerName ?? "Sem nome"}
                      {o.payerEmail && (
                        <span className="text-ink/40"> · {o.payerEmail}</span>
                      )}
                    </p>
                    <p className="mt-1 font-mono text-[0.62rem] text-ink/35">
                      #{o.paymentId}
                    </p>
                  </div>

                  {/* Data */}
                  <div className="shrink-0 text-right text-[0.62rem] uppercase tracking-[0.25em] text-ink/40">
                    {new Date(o.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })}
                  </div>
                </div>

                {/* Ações */}
                {o.refundStatus !== "refunded" && o.refundStatus !== "manual" && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/[0.06] pt-4">
                    <button
                      onClick={() => resolve(o.id, "refunded")}
                      className="rounded-full border border-green-600/30 bg-green-600/[0.06] px-4 py-2 text-[0.6rem] uppercase tracking-[0.25em] text-green-700 transition-colors hover:bg-green-600/[0.12]"
                    >
                      Marcar como reembolsado
                    </button>
                    <button
                      onClick={() => resolve(o.id, "manual")}
                      className="rounded-full border border-ink/15 px-4 py-2 text-[0.6rem] uppercase tracking-[0.25em] text-ink/55 transition-colors hover:border-gold/50 hover:text-gold"
                    >
                      Resolvido manualmente
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}