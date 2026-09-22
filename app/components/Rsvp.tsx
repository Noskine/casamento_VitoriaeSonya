import Reveal from "./Reveal";

export default function Rsvp() {
  return (
    <section className="relative overflow-hidden bg-ink px-6 py-28 text-cream sm:py-36">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(176,141,87,0.28), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold-soft">
            Confirmação de presença
          </p>
          <h2 className="mt-6 font-display text-4xl font-light leading-tight sm:text-5xl">
            Sua presença é o nosso
            <span className="italic text-gold-soft"> maior presente</span>
          </h2>
          <p className="mx-auto mt-7 max-w-md leading-relaxed text-cream/60">
            Pedimos a gentileza de confirmar até o dia{" "}
            <span className="text-cream"> 01 de Novembro de 2026</span> para que
            possamos preparar tudo com muito carinho.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/rsvp"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-gold/60 px-10 py-4 text-[0.72rem] uppercase tracking-[0.3em] text-gold-soft transition-colors duration-500 hover:text-ink"
            >
              <span className="absolute inset-0 -z-0 translate-y-full bg-gold transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />
              <span className="relative z-10">Confirmar presença</span>
            </a>

            <a
              href="https://wa.me/5574999465276?text=Olá%20noivos,%20gostaria%20de%20tirar%20uma%20dúvida%20sobre%20o%20casamento."
              target="_blank"
              rel="noreferrer"
              className="text-[0.72rem] uppercase tracking-[0.3em] text-cream/50 underline decoration-cream/20 underline-offset-8 transition-colors hover:text-cream"
            >
              Falar com os noivos
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}