"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Petals from "./Petals";

const EASE = [0.22, 1, 0.36, 1] as const;

function Name({
  children,
  delay = 0,
}: {
  children: string;
  delay?: number;
}) {
  return (
    <span className="inline-flex overflow-hidden pb-[0.12em] leading-[0.85]">
      {children.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className="inline-block"
          initial={{ y: "115%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={{ duration: 1.25, delay: delay + i * 0.07, ease: EASE }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6"
    >
      {/* fundo animado */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <motion.div
          className="absolute -left-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-gold-soft/45 blur-[120px]"
          animate={{ x: [0, 70, 0], y: [0, 50, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-52 -right-32 h-[30rem] w-[30rem] rounded-full bg-sage/25 blur-[130px]"
          animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/3 top-1/4 h-[22rem] w-[22rem] rounded-full bg-gold/10 blur-[110px]"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <Petals />

      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center"
      >
        <motion.p
          className="mb-8 text-[0.68rem] uppercase tracking-[0.55em] text-ink/45"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
        >
          Vamos nos casar
        </motion.p>

        <h1 className="font-display font-light tracking-[-0.02em] text-ink">
          <span className="flex justify-center text-[clamp(3.4rem,15vw,9.5rem)]">
            <Name delay={0.55}>Vitória</Name>
          </span>

          <motion.span
            className="my-1 flex justify-center font-display text-[clamp(1.4rem,4vw,2.6rem)] italic text-gold"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 1.15, ease: EASE }}
          >
            &amp;
          </motion.span>

          <span className="flex justify-center text-[clamp(3.4rem,15vw,9.5rem)]">
            <Name delay={1.3}>Sonay</Name>
          </span>
        </h1>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 2, ease: EASE }}
        >
          <div className="flex items-center gap-4 text-[0.72rem] uppercase tracking-[0.4em] text-ink/65">
            <span className="h-px w-10 bg-gold/60" />
            <span>04 · 12 · 2026</span>
            <span className="h-px w-10 bg-gold/60" />
          </div>
          <p className="font-display text-lg italic text-ink/55 sm:text-xl">
            Bairro do Coqueiro · Mairi, BA
          </p>
        </motion.div>
      </motion.div>

      {/* indicador de scroll */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.5 }}
      >
        <span className="text-[0.6rem] uppercase tracking-[0.45em] text-ink/40">
          Role
        </span>
        <motion.span
          className="block h-12 w-px origin-top bg-gradient-to-b from-gold to-transparent"
          animate={{ scaleY: [1, 0.35, 1], opacity: [1, 0.35, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}