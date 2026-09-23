import { NextResponse } from "next/server";
import { reserveGift } from "../../../../../lib/gift-store";
import { reservationSchema } from "../../../../../lib/gift-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    await reserveGift(id, parsed.data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro.";
    const status = msg.includes("reservou") ? 409 : 500;
    console.error("[gifts] reserve:", err);
    return NextResponse.json({ error: msg }, { status });
  }
}