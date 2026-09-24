// app/presentes/obrigado/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Ornament from "../../components/Ornament";
import StatusChecker from "./StatusChecker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Obrigado · Ana & Lucas",
  robots: { index: false, follow: false },
};

export default async function ObrigadoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rid?: string }>;
}) {
  const { status = "pending", rid } = await searchParams;

  // Se veio um ID de reserva, delega para o verificador em tempo real
  if (rid) {
    return <StatusChecker reservationId={rid} initialStatus={status} />;
  }

  // Fallback: sem ID, mostra mensagem simples baseada no parâmetro
  return <StaticThanks status={status} />;
}

/* -------------------------------------------------------------------------- */
/*  Fallback quando não há reservationId na URL                                */
/* -------------------------------------------------------------------------- */

function StaticThanks({ status }: { status: string }) {
  const copy: Record<string, { title: string; text: string }> = {
    approved: {
      title: "Pagamento aprovado!",
      text: "Muito obrigado pelo presente. Mal podemos esperar para celebrar esse dia com você. 🤍",
    },
    pending: {
      title: "Pagamento em processamento",
      text: "Assim que o Mercado Pago confirmar o pagamento, enviaremos um e-mail pra você. Pode levar alguns minutos.",
    },
    rejected: {
      title: "O pagamento não foi aprovado",
      text: "Nada foi cobrado. Você pode tentar novamente com outro método ou entrar em contato com os noivos.",
    },
  };

  const c = copy[status] ?? copy.pending;

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-24 text-ink">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-4xl font-light leading-tight sm:text-5xl">
          {c.title}
        </h1>
        <Ornament className="mt-7" />
        <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-ink/60">
          {c.text}
        </p>
        <div className="mt-12">
          <Link
            href="/#presentes"
            className="rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)]"
          >
            Voltar aos presentes
          </Link>
        </div>
      </div>
    </main>
  );
}