// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getSupabase } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  // 1. Só admin pode subir
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Lê o form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Formulário inválido." },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado." },
      { status: 400 },
    );
  }

  // 3. Valida tamanho
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Máximo 5 MB." },
      { status: 413 },
    );
  }

  // 4. Valida tipo
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG, WEBP ou AVIF." },
      { status: 415 },
    );
  }

  // 5. Gera nome único
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;

  // 6. Sobe pro bucket
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabase();

  const { error } = await supabase.storage
    .from("gifts")
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: "31536000", // 1 ano
      upsert: false,
    });

  if (error) {
    console.error("[upload]", error);
    return NextResponse.json(
      { error: "Falha ao enviar a imagem." },
      { status: 500 },
    );
  }

  // 7. Retorna a URL pública
  const { data } = supabase.storage.from("gifts").getPublicUrl(filename);

  return NextResponse.json({
    url: data.publicUrl,
    path: filename,
  });
}

/* -------------------------------------------------------------------------- */
/*  DELETE — opcional, para apagar imagens do bucket                           */
/* -------------------------------------------------------------------------- */

export async function DELETE(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json({ error: "Path obrigatório." }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase.storage.from("gifts").remove([path]);

  if (error) {
    console.error("[upload] delete:", error);
    return NextResponse.json({ error: "Falha ao remover." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
} 