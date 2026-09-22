// app/rsvp/ClosedState.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Ornament from "../components/Ornament";
import { RSVP_DEADLINE_LABEL } from "../../lib/rsvp";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ClosedState() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-gold-soft/30 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-40 bottom-0 h-[24rem] w-[24rem] rounded-full bg-sage/15 blur-[130px]"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-[0.63rem] uppercase tracking-[0.35em] text-ink/45 transition-colors hover:text-gold"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>
            Voltar ao convite
          </Link>
        </motion.div>

        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.15, ease: EASE }}
        >
          {/* ícone de ampulheta / relógio */}
          <div className="mx-auto h-14 w-14 text-gold">
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <motion.circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: EASE }}
              />
              <motion.path
                d="M12 7v5.5l3.2 2"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
              />
            </svg>
          </div>

          <p className="mt-8 text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            Prazo encerrado
          </p>

          <h1 className="mt-5 font-display text-4xl font-light leading-tight sm:text-5xl">
            As confirmações
            <span className="italic text-gold"> foram encerradas</span>
          </h1>

          <Ornament className="mt-8" />

          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-ink/60">
            O prazo para confirmar presença terminou em{" "}
            <span className="text-ink/80">{RSVP_DEADLINE_LABEL}</span>, mas
            ficamos muito felizes que você quis estar com a gente.
          </p>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/50">
            Se houve algum imprevisto e você ainda precisa confirmar, fale
            diretamente com os noivos — vamos fazer o possível para acomodar.
          </p>

          <motion.div
            className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
          >
            <a
              href="https://wa.me/5500000000000?text=Oi!%20N%C3%A3o%20consegui%20confirmar%20a%20tempo%2C%20posso%20ainda%3F"
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
            >
              <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
              <span className="relative z-10">Falar com os noivos</span>
            </a>

            <Link
              href="/"
              className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
            >
              Voltar ao convite
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}