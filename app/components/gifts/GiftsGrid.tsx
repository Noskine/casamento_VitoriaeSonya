"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import GiftCard from "./GiftCard";
import ReserveModal from "./ReserveModal";
import type { Gift } from "../../../lib/gift-store";

export default function GiftsGrid({ gifts: initial }: { gifts: Gift[] }) {
  const [gifts, setGifts] = useState(initial);
  const [selected, setSelected] = useState<Gift | null>(null);

  const available = gifts.filter((g) => !g.reservedBy).length;

  function handleReserved(giftId: string, reserverName: string) {
    setGifts((prev) =>
      prev.map((g) =>
        g.id === giftId ? { ...g, reservedBy: reserverName } : g,
      ),
    );
    setSelected(null);
  }

  if (gifts.length === 0) {
    return (
      <p className="py-16 text-center font-display text-xl text-ink/40">
        A lista está sendo preparada…
      </p>
    );
  }

  return (
    <>
      {available > 0 && (
        <p className="mb-10 text-center text-[0.62rem] uppercase tracking-[0.35em] text-ink/40">
          {available}{" "}
          {available === 1 ? "presente disponível" : "presentes disponíveis"}
        </p>
      )}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {gifts.map((gift, i) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            index={i}
            onSelect={() => !gift.reservedBy && setSelected(gift)}
          />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <ReserveModal
            gift={selected}
            onClose={() => setSelected(null)}
            onReserved={handleReserved}
          />
        )}
      </AnimatePresence>
    </>
  );
}