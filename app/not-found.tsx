// app/not-found.tsx
import type { Metadata } from "next";
import Link from "next/link";
import NotFoundClient from "./NotFoundClient";

export const metadata: Metadata = {
  title: "Página não encontrada · Vitória & Sonay",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundClient />;
}