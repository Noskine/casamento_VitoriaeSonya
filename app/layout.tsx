// app/layout.tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vitória & Sonay · 04 de Dezembro de 2026",
  description:
    "Com a bênção de Deus e a alegria de nossas famílias, convidamos você para celebrar o nosso casamento.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}