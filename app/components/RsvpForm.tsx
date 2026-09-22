// app/rsvp/RsvpForm.tsx
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  type Variants,
} from "motion/react";
import Ornament from "../components/Ornament";

const EASE = [0.22, 1, 0.36, 1] as const;

type Attendance = "yes" | "no";
type Status = "idle" | "sending" | "done";

const INPUT =
  "w-full rounded-xl border border-ink/10 bg-cream px-4 py-3.5 text-sm text-ink placeholder:text-ink/30 outline-none transition-colors duration-300 focus:border-gold/60";
const LABEL =
  "mb-2 block text-[0.63rem] uppercase tracking-[0.35em] text-ink/50 transition-colors duration-300 group-focus-within:text-gold";

/* ----------------------------- Variants de stagger ------------------------- */

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.75, ease: EASE },
  },
};

/* ----------------------------- Campos animados ---------------------------- */

function Field({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

/** Input com underline dourado que cresce no foco */
function FancyInput({
  id,
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
}) {
  return (
    <div className="group">
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <div className="relative">
        <input id={id} className={`${INPUT} peer ${className}`} {...props} />
        <motion.span
          className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] origin-left rounded-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft"
          initial={false}
          animate={{ scaleX: 0 }}
          whileInView={{ scaleX: 0 }}
          // usa classe CSS via peer para foco, mas com a transição do motion
          style={{ width: "100%" }}
          variants={{
            rest: { scaleX: 0 },
            focus: { scaleX: 1 },
          }}
        />
        {/* linha de foco controlada por CSS peer (mais confiável) */}
        <span className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:scale-x-100" />
      </div>
    </div>
  );
}

/* ------------------------------- Componente -------------------------------- */

export default function RsvpForm() {
  const [attending, setAttending] = useState<Attendance>("yes");
  const [guests, setGuests] = useState(0);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "idle") return;

    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");

    try {
      // 🔌 Troque por sua API / Formspree / Resend:
      // await fetch("/api/rsvp", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ ...data, attending, guests }),
      // });
      console.log("RSVP:", { ...data, attending, guests });
      await new Promise((r) => setTimeout(r, 1100));
      setStatus("done");
    } catch {
      setStatus("idle");
    }
  }

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pt-20">
      {/* fundo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-gold-soft/35 blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-40 bottom-0 h-[24rem] w-[24rem] rounded-full bg-sage/20 blur-[130px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto max-w-2xl">
        {/* voltar */}
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

        {/* cabeçalho */}
        <motion.header
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: EASE }}
        >
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            Confirmação de presença
          </p>
          <h1 className="mt-5 font-display text-4xl font-light leading-tight sm:text-5xl">
            Você vem celebrar
            <span className="italic text-gold"> com a gente?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-ink/55">
            Pedimos a gentileza de responder até{" "}
            <span className="text-ink/80">10 de agosto de 2026</span>. Leva
            menos de um minuto.
          </p>
          <Ornament className="mt-8" />
        </motion.header>

        {/* formulário / sucesso */}
        <div className="mt-14">
          <AnimatePresence mode="wait" initial={false}>
            {status === "done" ? (
              <SuccessCard
                key="success"
                attending={attending}
                onReset={() => {
                  setStatus("idle");
                  setGuests(0);
                  setAttending("yes");
                }}
              />
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                variants={container}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -16, transition: { duration: 0.5, ease: EASE } }}
                className="space-y-7"
              >
                {/* nome + email */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FancyInput
                      id="name"
                      label="Nome completo"
                      name="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Como no convite"
                    />
                  </Field>
                  <Field>
                    <FancyInput
                      id="email"
                      label="E-mail"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="voce@email.com"
                    />
                  </Field>
                </div>

                {/* telefone */}
                <Field>
                  <FancyInput
                    id="phone"
                    label="Telefone / WhatsApp"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                  />
                </Field>

                {/* presença */}
                <Field>
                  <span className={LABEL}>Você poderá comparecer?</span>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: "yes", label: "Sim, estarei lá" },
                        { value: "no", label: "Infelizmente não" },
                      ] as const
                    ).map((opt) => {
                      const active = attending === opt.value;
                      return (
                        <motion.button
                          key={opt.value}
                          type="button"
                          onClick={() => setAttending(opt.value)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className={`relative overflow-hidden rounded-xl border px-4 py-3.5 text-[0.72rem] uppercase tracking-[0.2em] transition-colors duration-300 ${
                            active
                              ? "border-transparent text-cream"
                              : "border-ink/10 bg-cream text-ink/60 hover:border-gold/40 hover:text-ink"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="attending-pill"
                              className="absolute inset-0 rounded-xl bg-gold shadow-[0_14px_40px_-18px_rgba(176,141,87,0.9)]"
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 34,
                              }}
                            />
                          )}
                          <span className="relative z-10">{opt.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <input type="hidden" name="attending" value={attending} />
                </Field>

                {/* campos condicionais — só quando confirma presença */}
                <AnimatePresence initial={false}>
                  {attending === "yes" && (
                    <motion.div
                      key="yes-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <motion.div
                        className="space-y-7 pt-1"
                        variants={{
                          hidden: {},
                          show: {
                            transition: {
                              staggerChildren: 0.08,
                              delayChildren: 0.15,
                            },
                          },
                        }}
                        initial="hidden"
                        animate="show"
                      >
                        {/* acompanhantes */}
                        <motion.div variants={item}>
                          <span className={LABEL}>Acompanhantes</span>
                          <div className="flex items-center gap-5 rounded-xl border border-ink/10 bg-cream px-5 py-3.5">
                            <motion.button
                              type="button"
                              aria-label="Diminuir acompanhantes"
                              onClick={() =>
                                setGuests((g) => Math.max(0, g - 1))
                              }
                              disabled={guests === 0}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.9 }}
                              className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-30"
                            >
                              −
                            </motion.button>

                            <div className="relative grid h-8 w-10 place-items-center overflow-hidden">
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                  key={guests}
                                  initial={{ y: 16, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -16, opacity: 0 }}
                                  transition={{
                                    duration: 0.28,
                                    ease: EASE,
                                  }}
                                  className="absolute font-display text-2xl tabular-nums"
                                >
                                  {guests}
                                </motion.span>
                              </AnimatePresence>
                            </div>

                            <motion.button
                              type="button"
                              aria-label="Aumentar acompanhantes"
                              onClick={() =>
                                setGuests((g) => Math.min(6, g + 1))
                              }
                              disabled={guests === 6}
                              whileHover={{ scale: 1.08 }}
                              whileTap={{ scale: 0.9 }}
                              className="grid h-8 w-8 place-items-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-30"
                            >
                              +
                            </motion.button>

                            <AnimatePresence mode="wait" initial={false}>
                              <motion.span
                                key={guests}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 6 }}
                                transition={{ duration: 0.25, ease: EASE }}
                                className="ml-1 text-xs text-ink/40"
                              >
                                {guests === 0
                                  ? "Vou sozinho(a)"
                                  : guests === 1
                                    ? "1 acompanhante"
                                    : `${guests} acompanhantes`}
                              </motion.span>
                            </AnimatePresence>

                            <input type="hidden" name="guests" value={guests} />
                          </div>
                        </motion.div>

                        {/* nomes dos acompanhantes */}
                        <AnimatePresence initial={false}>
                          {guests > 0 && (
                            <motion.div
                              key="guest-names"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.45, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <div className="group pt-0">
                                <label htmlFor="guestNames" className={LABEL}>
                                  Nome dos acompanhantes
                                </label>
                                <div className="relative">
                                  <textarea
                                    id="guestNames"
                                    name="guestNames"
                                    rows={2}
                                    placeholder="Um nome por linha"
                                    className={`${INPUT} peer resize-none`}
                                  />
                                  <span className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:scale-x-100" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* restrições alimentares */}
                        <motion.div variants={item}>
                          <FancyInput
                            id="diet"
                            label="Restrições alimentares"
                            name="diet"
                            type="text"
                            placeholder="Vegetariano, sem glúten, alergias…"
                          />
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* mensagem */}
                <Field>
                  <div className="group">
                    <label htmlFor="message" className={LABEL}>
                      Deixe um recado para os noivos
                    </label>
                    <div className="relative">
                      <textarea
                        id="message"
                        name="message"
                        rows={3}
                        placeholder="Opcional, mas nós vamos adorar ler 💛"
                        className={`${INPUT} peer resize-none`}
                      />
                      <span className="pointer-events-none absolute bottom-0 left-0 h-[1.5px] w-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-gold-soft via-gold to-gold-soft transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] peer-focus:scale-x-100" />
                    </div>
                  </div>
                </Field>

                {/* submit */}
                <Field className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={status === "sending"}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="group relative w-full overflow-hidden rounded-full border border-gold bg-gold px-10 py-4 text-[0.72rem] uppercase tracking-[0.35em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {/* brilho varrendo no hover */}
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cream/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

                    {/* camada escura que sobe no hover */}
                    <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />

                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <AnimatePresence mode="wait" initial={false}>
                        {status === "sending" ? (
                          <motion.span
                            key="sending"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="flex items-center gap-3"
                          >
                            <motion.span
                              className="h-3.5 w-3.5 rounded-full border-2 border-cream/40 border-t-cream"
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                            Enviando…
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                          >
                            Confirmar presença
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </motion.button>

                  <p className="mt-4 text-center text-[0.68rem] text-ink/40">
                    Seus dados são usados apenas para organizar o evento.
                  </p>
                </Field>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Cartão de sucesso --------------------------- */

function SuccessCard({
  attending,
  onReset,
}: {
  attending: Attendance;
  onReset: () => void;
}) {
  const yes = attending === "yes";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative overflow-hidden rounded-3xl border border-ink/[0.07] bg-cream-dark/40 px-8 py-14 text-center sm:px-12"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-gold-soft/40 blur-[100px]"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
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

      <motion.h2
        className="mt-8 font-display text-3xl font-light sm:text-4xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
      >
        {yes ? "Presença confirmada!" : "Sentiremos sua falta"}
      </motion.h2>

      <motion.p
        className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink/60"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.25, ease: EASE }}
      >
        {yes
          ? "Muito obrigado por confirmar. Mal podemos esperar para celebrar esse dia ao seu lado. 🤍"
          : "Obrigado por nos avisar. Você estará em nossos pensamentos nesse dia tão especial."}
      </motion.p>

      <Ornament className="mt-10" />

      <motion.div
        className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.45, ease: EASE }}
      >
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-gold transition-colors duration-500 hover:text-cream"
        >
          <span className="absolute inset-0 -z-0 translate-y-full bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
          <span className="relative z-10">Voltar ao convite</span>
        </Link>

        <button
          type="button"
          onClick={onReset}
          className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
        >
          Enviar outra resposta
        </button>
      </motion.div>
    </motion.div>
  );
}