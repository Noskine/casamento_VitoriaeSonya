// app/presentes/obrigado/StatusChecker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import Ornament from "../../components/Ornament";

const EASE = [0.22, 1, 0.36, 1] as const;
const POLL_INTERVAL = 3000; // 3 segundos
const MAX_ATTEMPTS = 40; // ~2 minutos

type ReservationStatus = {
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  amountCents: number | null;
  gift: { name: string; image_url: string | null } | null;
};

type View = "checking" | "paid" | "pending" | "failed" | "expired" | "timeout";

export default function StatusChecker({
  reservationId,
  initialStatus,
}: {
  reservationId: string;
  initialStatus: string;
}) {
  const [view, setView] = useState<View>(() => {
    if (initialStatus === "approved") return "paid";
    if (initialStatus === "rejected" || initialStatus === "failure")
      return "failed";
    return "checking";
  });
  const [data, setData] = useState<ReservationStatus | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    // Se já está num estado terminal pelo parâmetro da URL, não precisa poll
    if (view === "paid" || view === "failed") return;

    let cancelled = false;

    async function check() {
      attemptsRef.current += 1;

      try {
        const res = await fetch(
          `/api/reservations/${reservationId}/status`,
          { cache: "no-store" },
        );

        if (!res.ok) {
          if (attemptsRef.current >= MAX_ATTEMPTS) {
            if (!cancelled) setView("timeout");
          }
          return;
        }

        const json: ReservationStatus = await res.json();
        if (cancelled) return;

        setData(json);

        // Decide a tela com base no status
        if (json.paymentStatus === "approved" || json.status === "paid") {
          setView("paid");
          return;
        }
        if (
          json.paymentStatus === "rejected" ||
          json.paymentStatus === "cancelled" ||
          json.paymentStatus === "refunded"
        ) {
          setView("failed");
          return;
        }
        if (json.status === "expired") {
          setView("expired");
          return;
        }
        if (json.paymentStatus === "pending") {
          setView("pending");
        }

        // Continua tentando enquanto não atingir o limite
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setView("timeout");
        }
      } catch (err) {
        console.error("[status checker] erro:", err);
      }
    }

    check(); // primeira checagem imediata
    const interval = setInterval(check, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [reservationId, view]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6 py-24 text-ink">
      {/* fundo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-40 top-10 h-[26rem] w-[26rem] rounded-full bg-gold-soft/30 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 bottom-10 h-[22rem] w-[22rem] rounded-full bg-sage/15 blur-[120px]"
          animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-lg">
        <AnimatePresence mode="wait" initial={false}>
          {view === "checking" && (
  <CheckingView key="checking" gift={data?.gift ?? null} />
)}
{view === "pending" && (
  <PendingView key="pending" gift={data?.gift ?? null} />
)}
{view === "paid" && (
  <PaidView
    key="paid"
    gift={data?.gift ?? null}
    amountCents={data?.amountCents}
    method={data?.paymentMethod}
  />
)}
          {view === "failed" && <FailedView key="failed" />}
          {view === "expired" && <ExpiredView key="expired" />}
          {view === "timeout" && <TimeoutView key="timeout" />}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*  Estados visuais                                                            */
/* -------------------------------------------------------------------------- */

const WRAP = "text-center";

function CheckingView({ gift }: { gift: ReservationStatus["gift"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={WRAP}
    >
      <div className="mx-auto h-16 w-16 text-gold">
        <motion.svg viewBox="0 0 52 52" className="h-full w-full">
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.2"
          />
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="150"
            initial={{ strokeDashoffset: 150 }}
            animate={{ strokeDashoffset: [150, 0, 150] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.svg>
      </div>

      <h1 className="mt-8 font-display text-4xl font-light leading-tight sm:text-5xl">
        Verificando o pagamento
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        {gift ? (
          <>
            Estamos aguardando a confirmação do Mercado Pago para o presente{" "}
            <strong className="font-medium text-ink">{gift.name}</strong>.
          </>
        ) : (
          "Estamos aguardando a confirmação do Mercado Pago."
        )}
      </p>

      <p className="mt-3 text-xs text-ink/40">
        Isso normalmente leva alguns segundos. Não feche esta página.
      </p>
    </motion.div>
  );
}

function PendingView({ gift }: { gift: ReservationStatus["gift"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={WRAP}
    >
      <div className="mx-auto h-16 w-16 text-gold">
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
            d="M26 15v13l8 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <p className="mt-8 text-[0.68rem] uppercase tracking-[0.5em] text-gold">
        Aguardando pagamento
      </p>

      <h1 className="mt-4 font-display text-4xl font-light leading-tight sm:text-5xl">
        Quase lá!
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        {gift ? (
          <>
            O Mercado Pago ainda está processando o pagamento do presente{" "}
            <strong className="font-medium text-ink">{gift.name}</strong>.
          </>
        ) : (
          "O Mercado Pago ainda está processando o pagamento."
        )}
      </p>

      <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-ink/45">
        Se você pagou via <strong>Pix</strong>, pode levar até 5 minutos. Se foi{" "}
        <strong>cartão</strong>, costuma ser na hora. Você receberá um e-mail
        assim que confirmarmos.
      </p>
    </motion.div>
  );
}

function PaidView({
  gift,
  amountCents,
  method,
}: {
  gift: ReservationStatus["gift"];
  amountCents?: number | null;
  method?: string | null;
}) {
  const formatted = amountCents
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amountCents / 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.9, ease: EASE }}
      className={`${WRAP} relative`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-gold-soft/45 blur-[100px]"
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

      <p className="mt-8 text-[0.68rem] uppercase tracking-[0.5em] text-gold">
        Pagamento confirmado
      </p>

      <h1 className="mt-4 font-display text-4xl font-light leading-tight sm:text-5xl">
        Muito obrigado!
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        {gift ? (
          <>
            Seu presente <strong className="font-medium text-ink">{gift.name}</strong> foi
            confirmado. Mal podemos esperar para celebrar esse dia ao seu lado. 🤍
          </>
        ) : (
          "Seu presente foi confirmado. Mal podemos esperar para celebrar esse dia ao seu lado. 🤍"
        )}
      </p>

      {(formatted || method) && (
        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-ink/[0.07] bg-cream-dark/40 px-6 py-5">
          {formatted && (
            <>
              <p className="text-[0.58rem] uppercase tracking-[0.35em] text-ink/45">
                Valor
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums text-gold">
                {formatted}
              </p>
            </>
          )}
          {method && (
            <p className="mt-3 text-[0.62rem] uppercase tracking-[0.3em] text-ink/40">
              via {method === "pix" ? "Pix" : "Cartão"}
            </p>
          )}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/#presentes"
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
        >
          <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
          <span className="relative z-10">Ver outros presentes</span>
        </Link>
        <Link
          href="/"
          className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
        >
          Ir para o convite
        </Link>
      </div>
    </motion.div>
  );
}

function FailedView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={WRAP}
    >
      <div className="mx-auto h-16 w-16 text-ink/30">
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
            d="M18 18l16 16M34 18L18 34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h1 className="mt-8 font-display text-4xl font-light leading-tight sm:text-5xl">
        Pagamento não aprovado
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        Nada foi cobrado. Você pode tentar novamente com outro método de
        pagamento ou entrar em contato com os noivos.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/#presentes"
          className="rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
        >
          Tentar novamente
        </Link>
      </div>
    </motion.div>
  );
}

function ExpiredView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={WRAP}
    >
      <div className="mx-auto h-16 w-16 text-gold">
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
            d="M26 15v13l8 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="mt-8 font-display text-4xl font-light leading-tight sm:text-5xl">
        Reserva expirada
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        Passaram-se mais de 30 minutos e o presente foi liberado para outra
        pessoa. Se você ainda quer presentear, escolha outro item da lista.
      </p>

      <div className="mt-12">
        <Link
          href="/#presentes"
          className="rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
        >
          Ver a lista
        </Link>
      </div>
    </motion.div>
  );
}

function TimeoutView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={WRAP}
    >
      <div className="mx-auto h-16 w-16 text-gold">
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
            d="M26 15v13l8 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="mt-8 font-display text-4xl font-light leading-tight sm:text-5xl">
        Ainda processando
      </h1>

      <Ornament className="mt-7" />

      <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
        O pagamento está levando mais tempo que o normal. Não se preocupe — você
        receberá um e-mail assim que o Mercado Pago confirmar.
      </p>

      <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-ink/45">
        Se preferir, entre em contato com os noivos pelo WhatsApp para
        confirmarmos manualmente.
      </p>

      <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
        >
          Falar com os noivos
        </a>
        <Link
          href="/#presentes"
          className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
        >
          Voltar aos presentes
        </Link>
      </div>
    </motion.div>
  );
}