"use client";

import { useEffect, useState } from "react";
import Reveal from "./Reveal";
import Ornament from "./Ornament";

const TARGET = new Date("2026-12-04T15:30:00-03:00").getTime();

type Time = { days: number; hours: number; minutes: number; seconds: number };

function getTime(): Time {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
  };
}

export default function Countdown() {
  const [time, setTime] = useState<Time | null>(null);

  useEffect(() => {
    setTime(getTime());
    const id = setInterval(() => setTime(getTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Dias", value: time?.days },
    { label: "Horas", value: time?.hours },
    { label: "Minutos", value: time?.minutes },
    { label: "Segundos", value: time?.seconds },
  ];

  return (
    <section className="relative border-y border-ink/[0.06] bg-cream-dark/50 px-6 py-20 sm:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="text-[0.68rem] uppercase tracking-[0.5em] text-gold">
            Contagem regressiva
          </p>
          <h2 className="mt-5 font-display text-3xl font-light sm:text-4xl">
            Faltam apenas
          </h2>
          <Ornament className="mt-7" />
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.label} delay={i * 0.09}>
              <div className="flex flex-col items-center gap-3">
                <span className="font-display text-5xl font-light tabular-nums text-ink sm:text-6xl">
                  {item.value === undefined
                    ? "--"
                    : String(item.value).padStart(2, "0")}
                </span>
                <span className="text-[0.62rem] uppercase tracking-[0.35em] text-ink/45">
                  {item.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}