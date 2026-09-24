import { Suspense } from "react";
import Link from "next/link";
import Ornament from "../../components/Ornament";

export const dynamic = "force-dynamic";

const COPY: Record<string, { title: string; text: string }> = {
  approved: {
    title: "Pagamento aprovado!",
    text: "Muito obrigado pelo presente. Mal podemos esperar para celebrar esse dia com você. 🤍",
  },
  pending: {
    title: "Pagamento em processamento",
    text: "Assim que o Mercado Pago confirmar o pagamento, enviaremos um e-mail pra você. Pode ser que leve alguns minutos.",
  },
  rejected: {
    title: "O pagamento não foi aprovado",
    text: "Não se preocupe — nada foi cobrado. Você pode tentar novamente com outro método ou entrar em contato com os noivos.",
  },
};

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rid?: string }>;
}) {
  const { status = "pending" } = await searchParams;
  const copy = COPY[status] ?? COPY.pending;
  const approved = status === "approved";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-24 text-ink">
      <div className="mx-auto max-w-lg text-center">
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
            {approved ? (
              <path
                d="M15 27l8 8 15-16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M26 15v13M26 34h.01"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
          </svg>
        </div>

        <h1 className="mt-8 font-display text-4xl font-light leading-tight sm:text-5xl">
          {copy.title}
        </h1>

        <Ornament className="mt-7" />

        <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
          {copy.text}
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/#presentes"
            className="rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
          >
            Voltar aos presentes
          </Link>
          <Link
            href="/"
            className="text-[0.68rem] uppercase tracking-[0.3em] text-ink/40 underline decoration-ink/20 underline-offset-8 transition-colors hover:text-ink"
          >
            Ir para o convite
          </Link>
        </div>
      </div>
    </main>
  );
}