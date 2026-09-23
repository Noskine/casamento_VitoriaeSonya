import { connection } from "next/server";
import { listGifts } from "../../../lib/gift-store";
import GiftsGrid from "./GiftsGrid";
import Ornament from "../../components/Ornament";

export default async function GiftsSection() {
  // Marca esta renderização como dinâmica — os presentes vêm sempre frescos
  // do Supabase, nunca do cache estático do build.
  await connection();

  const gifts = await listGifts();

  return (
    <section
      id="presentes"
      className="relative scroll-mt-20 border-t border-ink/[0.06] px-6 py-24 sm:py-32">
      {/* fundo suave */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-20 h-[24rem] w-[24rem] rounded-full bg-gold-soft/25 blur-[130px]" />
        <div className="absolute -right-32 bottom-10 h-[20rem] w-[20rem] rounded-full bg-sage/15 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            Lista de presentes
          </p>
          <h2 className="mt-5 font-display text-4xl font-light leading-tight sm:text-5xl">
            Um gesto de carinho
            <span className="italic text-gold"> para a nossa nova vida</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-ink/55">
            Sua presença é o nosso maior presente. Mas se quiser nos ajudar a
            montar o nosso lar, escolha uma lembrança abaixo — e nós
            combinamos o pagamento depois com todo carinho.
          </p>
          <Ornament className="mt-7" />
        </header>

        <div className="mt-14">
          <GiftsGrid gifts={gifts} />
        </div>
      </div>
    </section>
  );
}