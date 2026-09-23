// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/rsvp", () => ({
  isRsvpOpen: vi.fn(),
  RSVP_DEADLINE_LABEL: "1º de novembro de 2025",
}));

vi.mock("@/lib/rsvp-store", () => ({
  saveRsvp: vi.fn(),
  listRsvps: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  notifyCouple: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ ok: true }),
}));

import { isRsvpOpen } from "../../../lib/rsvp";
import { listRsvps, saveRsvp } from "../../../lib/rsvp-store";
import { rateLimit } from "../../../lib/rate-limit";

const mockIsRsvpOpen = vi.mocked(isRsvpOpen);
const mockSaveRsvp = vi.mocked(saveRsvp);
const mockListRsvps = vi.mocked(listRsvps);
const mockRateLimit = vi.mocked(rateLimit);

function postReq(body: unknown) {
  return new Request("http://localhost/api/rsvp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  name: "Maria Silva",
  email: "maria@example.com",
  attending: "yes",
  guests: 1,
};

describe("POST /api/rsvp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsRsvpOpen.mockReturnValue(true);
    mockRateLimit.mockReturnValue({ ok: true });
  });

  it("retorna 410 quando o prazo está encerrado", async () => {
    mockIsRsvpOpen.mockReturnValue(false);
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(410);
    expect(mockSaveRsvp).not.toHaveBeenCalled();
  });

  it("retorna 429 quando passa do rate limit", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfter: 30 });
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("retorna 400 para JSON inválido", async () => {
    const res = await POST(postReq("not-json{{"));
    expect(res.status).toBe(400);
  });

  it("retorna 400 para payload inválido", async () => {
    const res = await POST(postReq({ ...validBody, email: "x" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Dados inválidos.");
  });

  it("retorna 201 ao salvar com sucesso", async () => {
    mockSaveRsvp.mockResolvedValue({
      id: "abc",
      name: "Maria Silva",
      email: "maria@example.com",
      phone: "",
      attending: "yes",
      guests: 1,
      guestNames: "",
      diet: "",
      message: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await POST(postReq(validBody));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json).toMatchObject({ ok: true, id: "abc", attending: "yes" });
  });

  it("retorna 500 quando o save falha", async () => {
    mockSaveRsvp.mockRejectedValue(new Error("DB down"));
    const res = await POST(postReq(validBody));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/rsvp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RSVP_ADMIN_SECRET = "secret123";
  });

  it("retorna 401 sem secret", async () => {
    const res = await GET(new Request("http://localhost/api/rsvp"));
    expect(res.status).toBe(401);
  });

  it("retorna 401 com secret errado", async () => {
    const res = await GET(
      new Request("http://localhost/api/rsvp?secret=errado"),
    );
    expect(res.status).toBe(401);
  });

  it("aceita secret via header x-admin-secret", async () => {
    mockListRsvps.mockResolvedValue([]);
    const res = await GET(
      new Request("http://localhost/api/rsvp", {
        headers: { "x-admin-secret": "secret123" },
      }),
    );
    expect(res.status).toBe(200);
  });

  it("retorna totais corretos", async () => {
    mockListRsvps.mockResolvedValue([
      {
        id: "1",
        name: "A",
        email: "a@a.com",
        phone: "",
        attending: "yes",
        guests: 2,
        guestNames: "",
        diet: "",
        message: "",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "B",
        email: "b@b.com",
        phone: "",
        attending: "no",
        guests: 0,
        guestNames: "",
        diet: "",
        message: "",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ]);

    const res = await GET(
      new Request("http://localhost/api/rsvp?secret=secret123"),
    );
    const json = await res.json();

    expect(json.totals).toEqual({
      responses: 2,
      confirmed: 1,
      declined: 1,
      totalPeople: 3,
    });
    expect(json.rsvps).toHaveLength(2);
  });
});