import { describe, expect, it } from "vitest";
import { rsvpSchema } from "./rsvp-schema";

const valid = {
  name: "Maria Silva",
  email: "maria@example.com",
  attending: "yes" as const,
  guests: 2,
  guestNames: "João\nAna",
  diet: "vegetariano",
  message: "Parabéns!",
};

describe("rsvpSchema", () => {
  it("aceita dados válidos", () => {
    expect(rsvpSchema.safeParse(valid).success).toBe(true);
  });

  it("normaliza email para lowercase", () => {
    const result = rsvpSchema.parse({ ...valid, email: "MARIA@EXAMPLE.COM" });
    expect(result.email).toBe("maria@example.com");
  });

  it("remove espaços do nome", () => {
    const result = rsvpSchema.parse({ ...valid, name: "  Maria  " });
    expect(result.name).toBe("Maria");
  });

  it("rejeita email inválido", () => {
    expect(
      rsvpSchema.safeParse({ ...valid, email: "não-é-email" }).success,
    ).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    expect(rsvpSchema.safeParse({ ...valid, name: "M" }).success).toBe(false);
  });

  it("rejeita attending desconhecido", () => {
    expect(
      rsvpSchema.safeParse({ ...valid, attending: "talvez" }).success,
    ).toBe(false);
  });

  it("rejeita guests acima de 6", () => {
    expect(rsvpSchema.safeParse({ ...valid, guests: 7 }).success).toBe(false);
  });

  it("rejeita guests negativo", () => {
    expect(rsvpSchema.safeParse({ ...valid, guests: -1 }).success).toBe(false);
  });

  it("zera guests e limpa campos quando attending = 'no'", () => {
    const result = rsvpSchema.parse({
      ...valid,
      attending: "no",
      guests: 3,
      guestNames: "Alguém",
      diet: "vegano",
    });

    expect(result.guests).toBe(0);
    expect(result.guestNames).toBe("");
    expect(result.diet).toBe("");
  });

  it("aceita attending = 'no' sem guests", () => {
    const result = rsvpSchema.safeParse({
      name: "João",
      email: "j@j.com",
      attending: "no",
    });
    expect(result.success).toBe(true);
  });

  it("trata phone, guestNames, diet e message como opcionais", () => {
    const result = rsvpSchema.parse({
      name: "João",
      email: "j@j.com",
      attending: "yes",
    });
    expect(result.phone).toBe("");
    expect(result.guestNames).toBe("");
    expect(result.diet).toBe("");
    expect(result.message).toBe("");
  });
});