import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "rsvp_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function sign(value: string): string {
  const secret = process.env.ADMIN_SECRET ?? "";
  return createHmac("sha256", secret).update(value).digest("hex");
}

function makeToken(): string {
  const payload = Date.now().toString();
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;

  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

  const age = Date.now() - Number(payload);
  return age >= 0 && age < MAX_AGE * 1000;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function login(password: string): Promise<boolean> {
  if (!process.env.RSVP_ADMIN_SECRET) return false;
  if (password !== process.env.RSVP_ADMIN_SECRET) return false;

  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}