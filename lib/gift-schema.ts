// lib/gift-schema.ts
import { z } from "zod";

export const giftSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(120),
  description: z.string().trim().max(600).nullish(),
  imageUrl: z.string().trim().url("URL inválida").or(z.literal("")).nullish(),
  priceCents: z.coerce.number().int().min(0).max(100_000_00),
  externalLink: z
    .string()
    .trim()
    .url("URL inválida")
    .or(z.literal(""))
    .nullish(),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  active: z.coerce.boolean().default(true),
});

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  message: z.string().trim().max(600).nullish(),
  // Valor que a pessoa escolheu contribuir (em centavos)
  contributionCents: z.coerce.number().int().min(100, "Mínimo R$ 1,00"),
});

export type GiftInput = z.infer<typeof giftSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}