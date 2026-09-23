import { NextResponse } from "next/server";
import { createGift, listGifts } from "../../../lib/gift-store";
import { giftSchema } from "../../../lib/gift-schema";
import { isAuthenticated } from "../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const includeInactive =
    url.searchParams.get("all") === "1" && (await isAuthenticated());

  try {
    const gifts = await listGifts({ includeInactive });
    return NextResponse.json({ gifts });
  } catch (err) {
    console.error("[gifts] erro:", err);
    return NextResponse.json(
      { error: "Não foi possível listar." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = giftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const gift = await createGift(parsed.data);
    return NextResponse.json({ gift }, { status: 201 });
  } catch (err) {
    console.error("[gifts] erro:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro." },
      { status: 500 },
    );
  }
}