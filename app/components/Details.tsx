
import Reveal from "./Reveal";
import Ornament from "./Ornament";
import LocationButtons from "./LocationButtons";

const CARDS = [
  {
    title: "A Cerimônia",
    time: "15h30",
    place: "Congregação Presbiteriana do Bairro do Coqueiro",
    address: "Rua Augêncio Antunes dos Santos  · Bairro do Coqueiro, Mairi/BA",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
      >
        <circle cx="9.5" cy="14.5" r="5.5" />
        <circle cx="14.5" cy="14.5" r="5.5" />
        <path d="M12 3.5 10 6.5h4l-2-3Z" />
      </svg>
    ),
  },
  {
    title: "Traje",
    time: "Esporte fino",
    place: "Cores claras são bem-vindas",
    address: "Evite branco, é da noiva 🤍",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8"
      >
        <path d="M12 3c.6 4.2 1.8 5.4 6 6-4.2.6-5.4 1.8-6 6-.6-4.2-1.8-5.4-6-6 4.2-.6 5.4-1.8 6-6Z" />
        <path d="M18.2 16c.3 2 .9 2.6 2.8 3-1.9.4-2.5 1-2.8 3-.3-2-.9-2.6-2.8-3 1.9-.4 2.5-1 2.8-3Z" />
      </svg>
    ),
  },
];

export default function Details() {
  return (
    <section className="relative bg-cream-dark/40 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <Reveal className="text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            O grande dia
          </p>
          <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">
            Detalhes da celebração
          </h2>
          <Ornament className="mt-7" />
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {CARDS.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.12}>
              <div className="group h-full rounded-2xl border border-ink/[0.07] bg-cream px-8 py-10 text-center transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-[0_24px_60px_-30px_rgba(38,34,32,0.35)]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/25 text-gold transition-colors duration-500 group-hover:border-gold/60 group-hover:bg-gold/[0.06]">
                  {card.icon}
                </div>

                <h3 className="mt-7 font-display text-2xl font-light">
                  {card.title}
                </h3>
                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-gold">
                  {card.time}
                </p>

                <div className="mx-auto my-6 h-px w-10 bg-ink/10" />

                <p className="text-sm leading-relaxed text-ink/70">
                  {card.place}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/45">
                  {card.address}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="mt-6">
            <p className="mb-4 text-[0.62rem] uppercase tracking-[0.35em] text-ink/40">
              Como chegar
            </p>
            <LocationButtons />
          </div>
        </div>
      </div>
    </section>
  );
}