"use client";

import { useActionState } from "react";
import { motion } from "motion/react";
import { loginAction } from "./actions";
import Ornament from "../components/Ornament";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="w-full max-w-sm rounded-3xl border border-ink/[0.07] bg-cream-dark/40 px-8 py-12 text-center"
    >
      <p className="text-[1rem] uppercase tracking-[0.5em] text-gold">
        Painel interno
      </p>
      <h1 className="mt-4 font-display text-3xl font-light">
        Vitória <span className="italic text-gold">&</span> Sonay
      </h1>
      <Ornament className="mt-6" />

      <form action={formAction} className="mt-10 space-y-5 text-left">
        <div className="group">
          <label
            htmlFor="password"
            className="mb-2 block text-[0.63rem] uppercase tracking-[0.35em] text-ink/50 transition-colors group-focus-within:text-gold"
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="peer w-full rounded-xl border border-ink/10 bg-cream px-4 py-3.5 text-sm outline-none transition-colors focus:border-gold/60"
            />
            <span className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft transition-transform duration-500 peer-focus:scale-x-100" />
          </div>
        </div>

        {state?.error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-center text-xs text-red-700"
          >
            {state.error}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative w-full overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.35em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)] disabled:opacity-70"
        >
          <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
          <span className="relative z-10">
            {pending ? "Entrando…" : "Entrar"}
          </span>
        </motion.button>
      </form>

      <p className="mt-8 text-[0.62rem] text-ink/35">
        A senha é a mesma definida em <code>ADMIN_SECRET</code>.
      </p>
    </motion.div>
  );
}