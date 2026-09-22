// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-ink px-6 pb-14 pt-4 text-center text-cream">
        <p className="font-display text-3xl font-light tracking-wide">
          Vitória <span className="italic text-gold">&amp;</span> Sonay
        </p>
        <p className="mt-4 text-[0.62rem] uppercase tracking-[0.45em] text-cream/40">
          04 · 12 · 2026 — Mairi, BA
        </p>
        <p className="mt-8 font-display text-lg italic text-gold-soft">
          #VamosCasar
        </p>
        <div className="mx-auto max-w-3xl border-t border-cream/10 pt-2 mt-4">
          <p className="font-display text-sm font-light tracking-wide">
            &copy; 2026 Vitória e Sonay. Todos os direitos reservados.
          </p>
        </div>
    </footer>
  );
}