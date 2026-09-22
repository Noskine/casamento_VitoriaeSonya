import { NextResponse } from "next/server";
import { RSVP_DEADLINE_LABEL, isRsvpOpen } from "../../../lib/rsvp";
import { rsvpSchema } from "../../../lib/rsvp-schema";
import { listRsvps, saveRsvp } from "../../../lib/rsvp-store";
import { notifyCouple } from "../../../lib/email";
import { rateLimit } from "../../../lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isRsvpOpen()) {
    return NextResponse.json(
      { error: `As confirmações encerraram em ${RSVP_DEADLINE_LABEL}.` },
      { status: 410 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Dados inválidos.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const stored = await saveRsvp(parsed.data, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    notifyCouple(stored).catch((err) =>
      console.error("[rsvp] Falha ao notificar:", err),
    );

    return NextResponse.json(
      { ok: true, id: stored.id, attending: stored.attending, guests: stored.guests },
      { status: 201 },
    );
  } catch (err) {
    console.error("[rsvp] Falha ao salvar:", err);
    return NextResponse.json(
      { error: "Não foi possível salvar. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const secret = process.env.RSVP_ADMIN_SECRET;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ?? req.headers.get("x-admin-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const rows = await listRsvps();
    const yes = rows.filter((r) => r.attending === "yes");
    const no = rows.filter((r) => r.attending === "no");
    const totalPeople = yes.reduce((sum, r) => sum + 1 + r.guests, 0);

    return NextResponse.json({
      totals: {
        responses: rows.length,
        confirmed: yes.length,
        declined: no.length,
        totalPeople,
      },
      rsvps: rows,
    });
  } catch (err) {
    console.error("[rsvp] Falha ao listar:", err);
    return NextResponse.json(
      { error: "Não foi possível listar." },
      { status: 500 },
    );
  }
}