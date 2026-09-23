"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import ImageUploader from "../../components/admin/ImageUploader";
import Ornament from "../../components/Ornament";
import { formatBRL } from "../../../lib/gift-schema";
import type { Gift } from "../../../lib/gift-store";

const EASE = [0.22, 1, 0.36, 1] as const;
const INPUT =
  "w-full rounded-xl border border-ink/10 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-gold/60";
const LABEL =
  "mb-2 block text-[0.6rem] uppercase tracking-[0.35em] text-ink/50";

function parseBRLtoCents(value: string): number {
  const clean = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(clean);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export default function GiftsAdmin({
  initialGifts,
}: {
  initialGifts: Gift[];
}) {
  const [gifts, setGifts] = useState(initialGifts);
  const [adding, setAdding] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado do formulário
  const [imageUrl, setImageUrl] = useState("");
  const [formKey, setFormKey] = useState(0);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const fd = new FormData(e.currentTarget);
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(fd.get("name") ?? ""),
          description: String(fd.get("description") ?? ""),
          imageUrl: imageUrl || "",
          priceCents: parseBRLtoCents(String(fd.get("price") ?? "0")),
          externalLink: String(fd.get("externalLink") ?? ""),
          position: gifts.length,
          active: true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao salvar.");
      }

      const list = await fetch("/api/gifts?all=1").then((r) => r.json());
      setGifts(list.gifts);

      // Reset
      setImageUrl("");
      setAdding(false);
      setFormKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este presente? As reservas serão apagadas também.")) {
      return;
    }
    const res = await fetch(`/api/gifts/${id}`, { method: "DELETE" });
    if (res.ok) setGifts((prev) => prev.filter((g) => g.id !== id));
  }

  async function handleToggle(gift: Gift) {
    const res = await fetch(`/api/gifts/${gift.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !gift.active }),
    });
    if (res.ok) {
      setGifts((prev) =>
        prev.map((g) => (g.id === gift.id ? { ...g, active: !g.active } : g)),
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
          className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/45 transition-colors hover:text-gold"
              >
                ← Painel
              </Link>
              <span className="text-ink/20">·</span>
              <Link
                href="/#presentes"
                target="_blank"
                className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/45 transition-colors hover:text-gold"
              >
                Ver no site ↗
              </Link>
            </div>
            <h1 className="mt-3 font-display text-4xl font-light sm:text-5xl">
              Lista de presentes
            </h1>
            <Ornament className="mt-5 !justify-start" />
          </div>

          <motion.button
            type="button"
            onClick={() => {
              setAdding((v) => !v);
              setError(null);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0 rounded-full border border-gold bg-gold px-6 py-3 text-[0.62rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(176,141,87,1)]"
          >
            {adding ? "Cancelar" : "+ Novo presente"}
          </motion.button>
        </motion.header>

        {/* Formulário */}
        <AnimatePresence initial={false}>
          {adding && (
            <motion.form
              key="add-form"
              onSubmit={handleAdd}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="mt-10 overflow-hidden"
            >
              <div
                key={formKey}
                className="rounded-2xl border border-ink/[0.07] bg-cream-dark/30 p-6 sm:p-8"
              >
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Uploader ocupa as duas colunas no mobile, uma no desktop */}
                  <div className="sm:col-span-1">
                    <ImageUploader value={imageUrl} onChange={setImageUrl} />
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className={LABEL}>
                        Nome do presente
                      </label>
                      <input
                        id="name"
                        name="name"
                        required
                        placeholder="Ex.: Jogo de panelas"
                        className={INPUT}
                      />
                    </div>

                    <div>
                      <label htmlFor="price" className={LABEL}>
                        Valor (R$)
                      </label>
                      <input
                        id="price"
                        name="price"
                        required
                        placeholder="150,00"
                        inputMode="decimal"
                        className={INPUT}
                      />
                    </div>

                    <div>
                      <label htmlFor="externalLink" className={LABEL}>
                        Link externo (opcional)
                      </label>
                      <input
                        id="externalLink"
                        name="externalLink"
                        type="url"
                        placeholder="https://loja.com/produto"
                        className={INPUT}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className={LABEL}>
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="Um texto curto sobre o presente"
                      className={`${INPUT} resize-none`}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-5 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-center text-xs text-red-700"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="mt-6 w-full rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.68rem] uppercase tracking-[0.32em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)] disabled:opacity-70"
                >
                  {sending ? "Publicando…" : "Publicar presente"}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Lista */}
        <div className="mt-12 space-y-3">
          {gifts.length === 0 ? (
            <p className="py-20 text-center font-display text-xl text-ink/40">
              Nenhum presente cadastrado ainda.
            </p>
          ) : (
            gifts.map((gift, i) => (
              <motion.div
                key={gift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.4) }}
                className={`flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-cream px-4 py-3 transition-opacity ${
                  gift.active ? "" : "opacity-50"
                }`}
              >
                {gift.imageUrl ? (
                  <img
                    src={gift.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-cream-dark text-ink/25">
                    ?
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg">{gift.name}</p>
                  <p className="truncate text-xs text-ink/45">
                    {formatBRL(gift.priceCents)}
                    {gift.reservedBy && ` · Reservado por ${gift.reservedBy}`}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(gift)}
                  className="hidden shrink-0 rounded-full border border-ink/10 px-4 py-2 text-[0.58rem] uppercase tracking-[0.25em] text-ink/55 transition-colors hover:border-gold/40 hover:text-gold sm:block"
                >
                  {gift.active ? "Pausar" : "Ativar"}
                </button>

                <button
                  onClick={() => handleDelete(gift.id)}
                  aria-label="Remover"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/30 transition-colors hover:bg-red-500/[0.06] hover:text-red-600"
                >
                  ✕
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}