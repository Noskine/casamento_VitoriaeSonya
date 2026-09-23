// app/api/gifts/[id]/route.ts
import { NextResponse } from "next/server";
import { deleteGift, toggleGift } from "../../../../lib/gift-store";
import { isAuthenticated } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  try {
    await deleteGift(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body?.active !== "boolean") {
    return NextResponse.json({ error: "Campo 'active' inválido." }, { status: 400 });
  }

  try {
    await toggleGift(id, body.active);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro." }, { status: 500 });
  }
}