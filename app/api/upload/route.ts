import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { isAuthenticated } from "../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado." },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 5 MB." },
      { status: 413 },
    );
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP ou AVIF." },
      { status: 415 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const blob = await put(filename, new Blob([buffer]), {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      cacheControlMaxAge: 31536000,
    });

    return NextResponse.json({
      url: blob.url,
      path: blob.pathname,
    });
  } catch (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: "Falha ao enviar a imagem." },
      { status: 500 },
    );
  }
}