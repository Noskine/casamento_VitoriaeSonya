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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vitoriaesonay.site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Vitória & Sonay · 04 de Dezembro de 2026",
  description:
    "Com a bênção de Deus e a alegria de nossas famílias, convidamos você para celebrar o nosso casamento.",
  openGraph: {
    title: "Vitória & Sonay · 04 de Dezembro de 2026",
    description:
      "Com a bênção de Deus e a alegria de nossas famílias, convidamos você para celebrar o nosso casamento.",
    url: SITE_URL,
    siteName: "Vitória & Sonay",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.png", // caminho relativo — metadataBase resolve
        width: 1200,
        height: 630,
        alt: "Convite de casamento de Vitória e Sonay",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitória & Sonay · 04 de Dezembro de 2026",
    description:
      "Com a bênção de Deus e a alegria de nossas famílias, convidamos você para celebrar o nosso casamento.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${jost.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}