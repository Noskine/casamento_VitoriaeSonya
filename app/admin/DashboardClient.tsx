"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { logoutAction } from "./actions";
import Ornament from "../components/Ornament";
import type { StoredRsvp } from "../../lib/rsvp-store";
import { default as Link } from "next/link";
import { Gift } from "../../lib/gift-store";

const EASE = [0.22, 1, 0.36, 1] as const;

type Filter = "all" | "yes" | "no";

export default function DashboardClient({
  rsvps,
  gifts,
}: {
  rsvps: StoredRsvp[];
  gifts: Gift[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  /* -------------------------- Estatísticas gerais -------------------------- */

  const stats = useMemo(() => {
    const yes = rsvps.filter((r) => r.attending === "yes");
    const no = rsvps.filter((r) => r.attending === "no");
    const companions = yes.reduce((s, r) => s + r.guests, 0);
    return {
      total: rsvps.length,
      confirmed: yes.length,
      declined: no.length,
      people: yes.length + companions,
      companions,
    };
  }, [rsvps]);

  /* ------------------------------- Filtros -------------------------------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rsvps.filter((r) => {
      if (filter !== "all" && r.attending !== filter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        r.guestNames.toLowerCase().includes(q)
      );
    });
  }, [rsvps, query, filter]);

  /* ------------------------------ Export CSV ------------------------------ */

  function exportCsv() {
    const headers = [
      "Nome",
      "E-mail",
      "Telefone",
      "Presença",
      "Acompanhantes",
      "Nomes",
      "Restrições",
      "Recado",
      "Data",
    ];

    const rows = filtered.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.attending === "yes" ? "Sim" : "Não",
      String(r.guests),
      r.guestNames,
      r.diet,
      r.message,
      new Date(r.createdAt).toLocaleString("pt-BR"),
    ]);

    const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\n");

    // BOM para Excel abrir com acentos corretos
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `confirmacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------- Render --------------------------------- */

  return (
    <main className="min-h-screen bg-cream px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.5em] text-gold">
              Painel interno
            </p>
            <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">
              Confirmações
            </h1>
            <Ornament className="mt-5 !justify-start" />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-gold bg-gold px-5 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-cream"
            >
              Confirmações
            </Link>
            <Link
              href="/admin/presentes"
              className="rounded-full border border-ink/15 px-5 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold"
            >
              Presentes ({gifts.filter((g) => g.active).length})
            </Link>
          </div>
          <Link
  href="/admin/orfaos"
  className="rounded-full border border-ink/15 px-5 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-ink/60 transition-colors hover:border-gold/50 hover:text-gold"
>
  Órfãos
</Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
            >
              Sair
            </button>
          </form>
        </motion.header>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Confirmados" value={stats.confirmed} delay={0} />
          <StatCard label="Não vão" value={stats.declined} delay={0.06} />
          <StatCard
            label="Total de pessoas"
            value={stats.people}
            delay={0.12}
            highlight
          />
          <StatCard
            label="Acompanhantes"
            value={stats.companions}
            delay={0.18}
          />
        </div>

        {/* Controles */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Busca */}
            <div className="relative flex-1 sm:max-w-xs">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar nome, e-mail, telefone…"
                className="w-full rounded-full border border-ink/10 bg-cream px-5 py-2.5 text-sm outline-none transition-colors focus:border-gold/60"
              />
            </div>

            {/* Filtro */}
            <div className="flex gap-1 rounded-full border border-ink/10 bg-cream p-1">
              {(
                [
                  { value: "all", label: "Todos" },
                  { value: "yes", label: "Sim" },
                  { value: "no", label: "Não" },
                ] as const
              ).map((opt) => {
                const active = filter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`relative rounded-full px-4 py-1.5 text-[0.62rem] uppercase tracking-[0.25em] transition-colors ${active ? "text-cream" : "text-ink/50 hover:text-ink"
                      }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-full bg-gold"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                        }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="rounded-full border border-gold bg-cream px-6 py-2.5 text-[0.62rem] uppercase tracking-[0.3em] text-gold transition-colors hover:bg-gold hover:text-cream disabled:opacity-40"
          >
            Exportar CSV
          </button>
        </motion.div>

        {/* Tabela */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          className="mt-8 overflow-hidden rounded-2xl border border-ink/[0.07] bg-cream"
        >
          {filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="font-display text-xl text-ink/40">
                {rsvps.length === 0
                  ? "Nenhuma resposta ainda."
                  : "Nenhum resultado com esse filtro."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-ink/[0.06]">
              {filtered.map((r, i) => (
                <RsvpRow
                  key={r.id}
                  rsvp={r}
                  index={i}
                  expanded={expanded === r.id}
                  onToggle={() =>
                    setExpanded(expanded === r.id ? null : r.id)
                  }
                />
              ))}
            </ul>
          )}
        </motion.div>

        <p className="mt-6 text-center text-[0.62rem] text-ink/35">
          {filtered.length} de {rsvps.length}{" "}
          {rsvps.length === 1 ? "resposta" : "respostas"}
        </p>
      </div>
    </main>
  );
}

/* ------------------------------- StatCard -------------------------------- */

function StatCard({
  label,
  value,
  delay = 0,
  highlight = false,
}: {
  label: string;
  value: number;
  delay?: number;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={`rounded-2xl border px-6 py-5 ${highlight
          ? "border-gold/40 bg-gold/[0.06]"
          : "border-ink/[0.07] bg-cream"
        }`}
    >
      <p className="text-[0.6rem] uppercase tracking-[0.35em] text-ink/45">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-4xl font-light tabular-nums ${highlight ? "text-gold" : "text-ink"
          }`}
      >
        {value}
      </p>
    </motion.div>
  );
}

/* -------------------------------- RsvpRow -------------------------------- */

function RsvpRow({
  rsvp,
  index,
  expanded,
  onToggle,
}: {
  rsvp: StoredRsvp;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const yes = rsvp.attending === "yes";

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.02, 0.4) }}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-cream-dark/40"
      >
        {/* Status dot */}
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${yes ? "bg-gold" : "bg-ink/20"
            }`}
        />

        {/* Nome + email */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-light">
            {rsvp.name}
          </p>
          <p className="truncate text-xs text-ink/45">{rsvp.email}</p>
        </div>

        {/* Acompanhantes */}
        {yes && (
          <span className="hidden shrink-0 text-xs text-ink/50 sm:block">
            {rsvp.guests === 0
              ? "sozinho(a)"
              : `+${rsvp.guests} ${rsvp.guests === 1 ? "acomp." : "acomps."}`}
          </span>
        )}

        {/* Data */}
        <span className="hidden shrink-0 text-[0.65rem] uppercase tracking-[0.2em] text-ink/35 md:block">
          {new Date(rsvp.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>

        {/* Chevron */}
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="shrink-0 text-ink/30"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-ink/[0.06] bg-cream-dark/30 px-6 py-6 sm:grid-cols-2">
              <Detail label="Telefone" value={rsvp.phone || "—"} />
              <Detail
                label="Presença"
                value={yes ? "Confirmada" : "Não poderá ir"}
              />
              {yes && (
                <Detail
                  label="Acompanhantes"
                  value={String(rsvp.guests)}
                />
              )}
              {yes && rsvp.guestNames && (
                <Detail label="Nomes" value={rsvp.guestNames} />
              )}
              {yes && rsvp.diet && (
                <Detail label="Restrições" value={rsvp.diet} />
              )}
              {rsvp.message && (
                <Detail label="Recado" value={rsvp.message} full />
              )}
              <Detail
                label="Recebido em"
                value={new Date(rsvp.createdAt).toLocaleString("pt-BR")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function Detail({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-[0.58rem] uppercase tracking-[0.35em] text-ink/40">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{value}</p>
    </div>
  );
}

