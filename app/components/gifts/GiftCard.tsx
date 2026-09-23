"use client";

import { motion } from "motion/react";
import { formatBRL } from "../../../lib/gift-schema";
import type { Gift } from "../../../lib/gift-store";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function GiftCard({
  gift,
  index,
  onSelect,
}: {
  gift: Gift;
  index: number;
  onSelect: () => void;
}) {
  const reserved = !!gift.reservedBy;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.85, delay: index * 0.08, ease: EASE }}
      className="group flex flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-cream transition-shadow duration-500 hover:shadow-[0_30px_60px_-30px_rgba(38,34,32,0.35)]"
    >
      {/* Imagem */}
      <div className="relative aspect-[4/5] overflow-hidden bg-cream-dark">
        {gift.imageUrl ? (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="h-16 w-16"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

        {/* Overlay quando reservado */}
        {reserved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="absolute inset-0 flex items-center justify-center bg-ink/60 backdrop-blur-[3px]"
          >
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 text-cream">
                <svg viewBox="0 0 52 52" className="h-full w-full">
                  <circle
                    cx="26"
                    cy="26"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M15 27l8 8 15-16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[0.62rem] uppercase tracking-[0.4em] text-cream/80">
                Reservado
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <h3 className="font-display text-2xl font-light leading-tight">
          {gift.name}
        </h3>

        {gift.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/55">
            {gift.description}
          </p>
        )}

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.35em] text-ink/40">
                Valor sugerido
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums text-gold">
                {formatBRL(gift.priceCents)}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={onSelect}
            disabled={reserved}
            whileHover={!reserved ? { scale: 1.015 } : undefined}
            whileTap={!reserved ? { scale: 0.985 } : undefined}
            transition={{ duration: 0.2, ease: EASE }}
            className="group/btn relative mt-5 w-full overflow-hidden rounded-full border border-gold bg-cream px-6 py-3 text-[0.68rem] uppercase tracking-[0.3em] text-gold transition-colors duration-500 hover:text-cream disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30"
          >
            {!reserved && (
              <span className="absolute inset-0 translate-y-full bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/btn:translate-y-0" />
            )}
            <span className="relative z-10">
              {reserved ? "Já reservado" : "Presentear"}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}