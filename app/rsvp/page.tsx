// app/rsvp/page.tsx
import type { Metadata } from "next";
import RsvpForm from "../components/RsvpForm";
import ClosedState from "./ClosedState";
import ScrollProgress from "../components/ScrollProgress";
import Footer from "../components/Footer";
import { isRsvpOpen } from "../../lib/rsvp";

// Reavalia a data a cada request (sem isso a página vira estática no build).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmação de Presença · Ana & Lucas",
  description:
    "Confirme sua presença no nosso casamento. Confirmações abertas até 1º de novembro de 2026.",
};

export default function RsvpPage() {
  const open = isRsvpOpen();

  return (
    <main className="relative overflow-x-hidden bg-cream text-ink">
      <ScrollProgress />
      {open ? <RsvpForm /> : <ClosedState />}
      <Footer />
    </main>
  );
}