import { describe, expect, it } from "vitest";
import {
  RSVP_DEADLINE,
  daysUntilDeadline,
  isRsvpOpen,
  msUntilDeadline,
} from "./rsvp";

const ONE_DAY = 86_400_000;

describe("isRsvpOpen", () => {
  it("retorna true antes do prazo", () => {
    const before = new Date(RSVP_DEADLINE.getTime() - 1000);
    expect(isRsvpOpen(before)).toBe(true);
  });

  it("retorna false depois do prazo", () => {
    const after = new Date(RSVP_DEADLINE.getTime() + 1000);
    expect(isRsvpOpen(after)).toBe(false);
  });

  it("retorna true exatamente no instante do prazo", () => {
    expect(isRsvpOpen(new Date(RSVP_DEADLINE))).toBe(true);
  });
});

describe("msUntilDeadline", () => {
  it("nunca retorna negativo", () => {
    const past = new Date(RSVP_DEADLINE.getTime() + 10_000);
    expect(msUntilDeadline(past)).toBe(0);
  });

  it("retorna a diferença correta antes do prazo", () => {
    const oneDayBefore = new Date(RSVP_DEADLINE.getTime() - ONE_DAY);
    expect(msUntilDeadline(oneDayBefore)).toBe(ONE_DAY);
  });
});

describe("daysUntilDeadline", () => {
  it("arredonda para baixo", () => {
    const oneAndHalfDays = new Date(RSVP_DEADLINE.getTime() - ONE_DAY * 1.5);
    expect(daysUntilDeadline(oneAndHalfDays)).toBe(1);
  });

  it("retorna 0 após o prazo", () => {
    const past = new Date(RSVP_DEADLINE.getTime() + 10_000);
    expect(daysUntilDeadline(past)).toBe(0);
  });
});