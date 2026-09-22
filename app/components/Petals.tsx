"use client";

import { motion } from "motion/react";

// valores determinísticos (nada de Math.random) pra não quebrar a hidratação
const PETALS = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.3 + 4) % 100,
  size: 7 + ((i * 13) % 11),
  duration: 16 + ((i * 5) % 13),
  delay: -((i * 3.7) % 22),
  drift: (i % 2 === 0 ? 1 : -1) * (24 + ((i * 7) % 70)),
  spin: 220 + ((i * 47) % 420),
  opacity: 0.18 + ((i * 9) % 22) / 100,
}));

export default function Petals() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-[-10vh] block bg-gold-soft"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.65,
            borderRadius: "50% 0 50% 0",
          }}
          animate={{
            y: ["-10vh", "110vh"],
            x: [0, p.drift, 0],
            rotate: [0, p.spin],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}