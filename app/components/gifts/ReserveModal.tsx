"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatBRL } from "../../../lib/gift-schema";
import type { Gift } from "../../../lib/gift-store";

const EASE = [0.22, 1, 0.36, 1] as const;
const RESERVATION_TTL_MINUTES = 30;

const INPUT =
  "w-full rounded-xl border border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-gold/60";

export default function ReserveModal({
  gift,
  onClose,
  onReserved,
}: {
  gift: Gift;
  onClose: () => void;
  onReserved: (giftId: string, reserverName: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reserverName, setReserverName] = useState("");

  // Trava o scroll do body
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Fecha no ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "sending") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, status]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "idle") return;

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    setError(null);
    setStatus("sending");

    try {
      const res = await fetch(`/api/gifts/${gift.id}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Não foi possível reservar.");
      }

      const { initPoint } = await res.json();

      if (!initPoint) {
        throw new Error("Pagamento indisponível no momento.");
      }

      // Guarda o nome para uso posterior, se precisar
      setReserverName(name);

      // Redireciona pro Checkout Pro do Mercado Pago
      window.location.href = initPoint;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setStatus("idle");
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => status !== "sending" && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.55, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-ink/[0.07] bg-cream shadow-[0_40px_100px_-40px_rgba(38,34,32,0.6)]"
      >
        {/* Botão de fechar */}
        <button
          type="button"
          onClick={() => status !== "sending" && onClose()}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-cream/90 text-ink/50 transition-colors hover:bg-cream hover:text-ink"
        >
          ✕
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {status === "done" ? (
            <SuccessState
              key="done"
              name={reserverName}
              onClose={onClose}
            />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {/* Imagem do topo */}
              {gift.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-cream-dark">
                  <img
                    src={gift.imageUrl}
                    alt={gift.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6">
                    <p className="text-[0.58rem] uppercase tracking-[0.4em] text-cream/70">
                      Você escolheu
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-light text-cream">
                      {gift.name}
                    </h3>
                  </div>
                </div>
              )}

              <div className="px-6 py-7 sm:px-8">
                {!gift.imageUrl && (
                  <h3 className="font-display text-2xl font-light">
                    {gift.name}
                  </h3>
                )}

                {gift.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink/55">
                    {gift.description}
                  </p>
                )}

                <div className="mt-5 flex items-baseline justify-between border-y border-ink/[0.06] py-4">
                  <span className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/45">
                    Valor sugerido
                  </span>
                  <span className="font-display text-2xl tabular-nums text-gold">
                    {formatBRL(gift.priceCents)}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="res-name"
                      className="mb-2 block text-[0.6rem] uppercase tracking-[0.35em] text-ink/50"
                    >
                      Seu nome
                    </label>
                    <input
                      id="res-name"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Como quer ser chamado(a)"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="res-email"
                      className="mb-2 block text-[0.6rem] uppercase tracking-[0.35em] text-ink/50"
                    >
                      E-mail
                    </label>
                    <input
                      id="res-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="voce@email.com"
                      className={INPUT}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="res-message"
                      className="mb-2 block text-[0.6rem] uppercase tracking-[0.35em] text-ink/50"
                    >
                      Recado (opcional)
                    </label>
                    <textarea
                      id="res-message"
                      name="message"
                      rows={2}
                      placeholder="Uma mensagem para os noivos"
                      className={`${INPUT} resize-none`}
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-center text-xs text-red-700"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Aviso sobre o prazo de 30 minutos */}
                  <div className="flex items-start gap-2.5 rounded-xl border border-gold/20 bg-gold/[0.05] px-4 py-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 7v5.5l3.2 2" />
                    </svg>
                    <p className="text-xs leading-relaxed text-ink/70">
                      Sua reserva é válida por{" "}
                      <strong className="font-medium text-ink">
                        30 minutos
                      </strong>
                      . Após esse período, o presente será liberado
                      automaticamente.
                    </p>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={status === "sending"}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="group relative w-full overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.68rem] uppercase tracking-[0.32em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {status === "sending" ? (
                        <>
                          <motion.span
                            className="h-3.5 w-3.5 rounded-full border-2 border-cream/40 border-t-cream"
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          Redirecionando…
                        </>
                      ) : (
                        "Ir para o pagamento"
                      )}
                    </span>
                  </motion.button>

                  <p className="pt-1 text-center text-[0.62rem] text-ink/40">
                    Você será redirecionado para o Mercado Pago para escolher
                    entre Pix, cartão ou boleto.
                  </p>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------- Cartão de sucesso --------------------------- */

function SuccessState({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative px-8 py-16 text-center"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-gold-soft/45 blur-[90px]"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>

      <div className="mx-auto h-16 w-16 text-gold">
        <svg viewBox="0 0 52 52" className="h-full w-full">
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: EASE }}
          />
          <motion.path
            d="M15 27l8 8 15-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: 0.7, ease: EASE }}
          />
        </svg>
      </div>

      <motion.h3
        className="mt-8 font-display text-3xl font-light"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1, ease: EASE }}
      >
        Muito obrigado, {name.split(" ")[0]}!
      </motion.h3>

      <motion.p
        className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink/55"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.15, ease: EASE }}
      >
        Seu presente foi reservado com sucesso. Você será redirecionado para o
        pagamento em instantes…
      </motion.p>

      <motion.button
        type="button"
        onClick={onClose}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.3, ease: EASE }}
        className="mt-10 rounded-full border border-gold bg-gold px-8 py-3 text-[0.68rem] uppercase tracking-[0.32em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
      >
        Voltar para a lista
      </motion.button>
    </motion.div>
  );
}