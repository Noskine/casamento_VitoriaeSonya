// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/gift-store", () => ({
  reserveGift: vi.fn(),
}));

import { reserveGift } from "../../../../../lib/gift-store";

const mockReserveGift = vi.mocked(reserveGift);

function makeReq(body: unknown) {
  return new Request("http://localhost/api/gifts/g1/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: "g1" }) };

describe("POST /api/gifts/[id]/reserve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna 400 para JSON inválido", async () => {
    const req = new Request("http://localhost/api/gifts/g1/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "não-json",
    });
    const res = await POST(req, params);
    expect(res.status).toBe(400);
  });

  it("retorna 400 para email inválido", async () => {
    const res = await POST(
      makeReq({ name: "Maria", email: "inválido" }),
      params,
    );
    expect(res.status).toBe(400);
  });

  it("retorna 201 ao reservar com sucesso", async () => {
    mockReserveGift.mockResolvedValue({ ok: true });
    const res = await POST(
      makeReq({ name: "Maria", email: "m@m.com", message: "Oi" }),
      params,
    );
    expect(res.status).toBe(201);
    expect(mockReserveGift).toHaveBeenCalledWith("g1", {
      name: "Maria",
      email: "m@m.com",
      message: "Oi",
    });
  });

  it("retorna 409 quando alguém reservou antes", async () => {
    mockReserveGift.mockRejectedValue(
      new Error("Alguém acabou de reservar este presente."),
    );
    const res = await POST(
      makeReq({ name: "Maria", email: "m@m.com" }),
      params,
    );
    expect(res.status).toBe(409);
  });

  it("retorna 500 em erro genérico", async () => {
    mockReserveGift.mockRejectedValue(new Error("DB down"));
    const res = await POST(
      makeReq({ name: "Maria", email: "m@m.com" }),
      params,
    );
    expect(res.status).toBe(500);
  });
});