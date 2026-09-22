"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import Reveal, { EASE } from "./Reveal";
import Ornament from "./Ornament";

const MOMENTS = [

  {
    year: "Mai 2025",
    title: "A primeira conversa",
    text: "Após a oração, veio a inquietação. No Instagram, viu a jovem e seu sorriso; não resistiu, mandou mensagem sem aviso. Dali em diante, sem fim, sem razão, a conversa virou paixão.",
  },
  {
    year: "Jun 2025",
    title: "O momento que mudou tudo",
    text: "Ela toda encantada, não sabia que aquele rapaz que estava conversando, era o mesmo que alguns dias depois, iria pedi-la em namoro de forma nada comum ao dizer que sempre seria com ela. E assim, começou uma das histórias de amor mais linda que já existiu.",
  },
  {
    year: "Ago 2025",
    title: "O primeiro buquê",
    text: "Antes mesmo do primeiro encontro, já sabíamos que estávamos destinados um ao outro. Entre lagrimas e sorrisos, o primeiro buquê de flores foi entregue, selando o início de uma linda história de amor.",
  },
  {
    year: "Dez 2025",
    title: "O primeiro encontro",
    text: "Depois de 570km de distância, finalmente nos encontramos. O primeiro encontro foi desajeitado, cheio de risadas e olhares que diziam mais do que palavras poderiam expressar. Logo a família o abraçou, e a conexão entre nós só cresceu. Aquele dia marcou o início de uma jornada que nos levaria a esse amor...",
  },
  {
    year: "2026",
    title: "Ele sempre esteve entre nós",
    text: "A cada passo que demos, sentimos a presença de Deus nos guiando. Ele sempre esteve entre nós, fortalecendo nosso amor e nos preparando para o dia em que nos tornaremos um só. A certeza de que fomos feitos um para o outro nos enche de alegria e gratidão.",
  },

];

export default function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 78%", "end 62%"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 26,
    restDelta: 0.001,
  });

  return (
    <section className="relative px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            Nossa história
          </p>
          <h2 className="mt-5 font-display text-4xl font-light sm:text-5xl">
            Como tudo começou
          </h2>
          <Ornament className="mt-7" />
        </Reveal>

        <div ref={ref} className="relative mt-16">
          <div className="absolute bottom-2 left-4 top-2 w-px bg-ink/10" />
          <motion.div
            className="absolute bottom-2 left-4 top-2 w-px origin-top bg-gold"
            style={{ scaleY }}
          />

          <ul className="space-y-14">
            {MOMENTS.map((m, i) => (
              <motion.li
                key={`${m.year}-${i}`}
                className="relative pl-14"
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-70px" }}
                transition={{ duration: 0.9, delay: i * 0.05, ease: EASE }}
              >
                <span className="absolute left-4 top-1 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-gold/30 bg-cream">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                </span>

                <p className="text-[0.65rem] uppercase tracking-[0.4em] text-gold">
                  {m.year}
                </p>
                <h3 className="mt-3 font-display text-2xl font-light sm:text-3xl">
                  {m.title}
                </h3>
                <p className="mt-3 max-w-xl leading-relaxed text-ink/60">
                  {m.text}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}