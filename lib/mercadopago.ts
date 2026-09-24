// lib/mercadopago.ts
import "server-only";
import { MercadoPagoConfig, Payment, PaymentRefund, Preference } from "mercadopago";

let client: MercadoPagoConfig | null = null;

export function getMP() {
  if (client) return client;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }

  client = new MercadoPagoConfig({ accessToken });
  return client;
}

export function getPreferenceClient() {
  return new Preference(getMP());
}

export function getPaymentClient() {
  return new Payment(getMP());
}

export function getRefundClient() {
  return new PaymentRefund(getMP());
}