// components/LocationButtons.tsx
"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * ⚠️ AJUSTE estas constantes com os dados reais do seu casamento.
 */
const VENUE = {
  name: "Quinta dos Ipês",
  // Endereço completo (usado como fallback e para o Waze)
  address: "Bairro do Coqueiro, Mairi - BA, Brasil",
  // Coordenadas (recomendado — mais preciso que endereço)
  // Pegue as coordenadas no Google Maps: clique com o botão direito no local
  // e clique nos números que aparecem (ex: -22.7396, -45.5908)
  lat: -11.7071877,
  lng: -40.1589059,
};

/* -------------------------------------------------------------------------- */
/*  URLs                                                                       */
/* -------------------------------------------------------------------------- */

// Google Maps — abre o app nativo no celular, o site no desktop
// Docs: https://developers.google.com/maps/documentation/urls/get-started
const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${VENUE.lat},${VENUE.lng}&travelmode=driving`;

// Waze — abre o app se instalado, senão abre o site
// Docs: https://developers.google.com/waze/deeplinks
const wazeUrl = `https://waze.com/ul?ll=${VENUE.lat},${VENUE.lng}&navigate=yes&zoom=17`;

// Fallback: busca pelo endereço (funciona se não tiver coordenadas)
const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${VENUE.name}, ${VENUE.address}`,
)}`;

export default function LocationButtons() {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      {/* Google Maps */}
      <motion.a
        href={googleMapsUrl}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-gold bg-gold px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-cream transition-shadow duration-500 hover:shadow-[0_20px_50px_-20px_rgba(176,141,87,1)] sm:w-auto"
      >
        <span className="absolute inset-0 translate-y-full bg-ink transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" />

        {/* Ícone do Google Maps */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative z-10 h-4 w-4"
        >
          <path d="M12 22s-8-6.5-8-12a8 8 0 1 1 16 0c0 5.5-8 12-8 12Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>

        <span className="relative z-10">Google Maps</span>
      </motion.a>

      {/* Waze */}
      <motion.a
        href={wazeUrl}
        target="_blank"
        rel="noreferrer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-ink/15 bg-cream px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.3em] text-ink/70 transition-colors duration-500 hover:border-gold/50 hover:text-gold sm:w-auto"
      >
        {/* Ícone do Waze (simplificado) */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-4 w-4"
        >
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2Zm-2 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-4 7c1.1 1 3.9 1 5 0" />
        </svg>

        <span>Waze</span>
      </motion.a>
    </div>
  );
}