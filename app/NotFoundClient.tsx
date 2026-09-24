// app/NotFoundClient.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";
import Ornament from "./components/Ornament";
import Petals from "./components/Petals";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function NotFoundClient() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6 py-24 text-ink">
      {/* Fundo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-40 top-10 h-[26rem] w-[26rem] rounded-full bg-gold-soft/30 blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 40, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 bottom-10 h-[22rem] w-[22rem] rounded-full bg-sage/20 blur-[120px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Pétalas caindo */}
      <Petals />

      <div className="relative mx-auto w-full max-w-lg text-center">
        {/* Número 404 grande com entrada escalonada */}
        <motion.div
          className="flex items-center justify-center gap-3 font-display text-[clamp(5rem,20vw,10rem)] font-light leading-none text-ink"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {["4", "0", "4"].map((digit, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.9, ease: EASE },
                },
              }}
              className={digit === "0" ? "italic text-gold" : ""}
            >
              {digit}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
        >
          <Ornament className="mt-8" />
        </motion.div>

        <motion.p
          className="mt-8 text-[0.68rem] uppercase tracking-[0.5em] text-gold"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
        >
          Página não encontrada
        </motion.p>

        <motion.h1
          className="mt-5 font-display text-3xl font-light leading-tight sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
        >
          Acho que essa página
          <span className="italic text-gold"> se perdeu no caminho</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink/55"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: EASE }}
        >
          O link que você seguiu pode estar quebrado, ou a página pode ter
          sido movida. Enquanto isso, você pode voltar para o convite.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.15, ease: EASE }}
        >
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
          >
            <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
            <span className="relative z-10 flex items-center gap-2">
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                ←
              </span>
              Voltar ao convite
            </span>
          </Link>

          <Link
            href="/#presentes"
            className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-gold"
          >
            Ver lista de presentes
          </Link>
        </motion.div>

        <motion.p
          className="mt-16 font-display text-lg italic text-ink/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
        >
          Vitória <span className="text-gold">&</span> Sonay · 04 · 12 · 2026
        </motion.p>
      </div>
    </main>
  );
}