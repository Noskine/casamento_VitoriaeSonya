import Hero from "./components/Hero";
import Countdown from "./components/Countdown";
import Details from "./components/Details";
import Rsvp from "./components/Rsvp";
import Footer from "./components/Footer";
import ScrollProgress from "./components/ScrollProgress";
import Story from "./components/Story";
import { Suspense } from "react";
import GiftsSkeleton from "./components/gifts/GiftsSkeleton";
import GiftsSection from "./components/gifts/GiftsSection";

export default function Home() {
  return (
    <main className="relative overflow-x-hidden bg-cream text-ink">
      <ScrollProgress />
      <Hero />
      <Countdown />
      <Story />
      <Details />
      <Rsvp />
      <Suspense fallback={<GiftsSkeleton />}>
        <GiftsSection />
      </Suspense>
      <Footer />
    </main>
  );
}