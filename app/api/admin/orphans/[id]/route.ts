// app/api/admin/orphans/[id]/route.ts
import { NextResponse } from "next/server";
import { isAuthenticated } from "../../../../../lib/admin-auth";
import { markOrphanResolved } from "../../../../../lib/orphan-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body?.status;

  if (status !== "manual" && status !== "refunded") {
    return NextResponse.json(
      { error: "Status inválido." },
      { status: 400 },
    );
  }

  try {
    await markOrphanResolved(id, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orphans] erro:", err);
    return NextResponse.json({ error: "Erro." }, { status: 500 });
  }
}