import { loadEnvConfig } from "@next/env";
import { put } from "@vercel/blob";
import { eq, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

function isLegacyGiftImage(value: string): URL | null {
  try {
    const url = new URL(value);
    if (
      !url.hostname.endsWith(".supabase.co") ||
      !url.pathname.startsWith("/storage/v1/object/public/gifts/")
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function main() {
  loadEnvConfig(process.cwd());

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Configure DATABASE_URL antes de migrar as imagens.");
  }

  const apply = process.argv.includes("--apply");
  if (apply && !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Configure BLOB_READ_WRITE_TOKEN antes de migrar as imagens.");
  }

  const client = postgres(connectionString, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  try {
    const rows = await db
      .select({ id: schema.gifts.id, imageUrl: schema.gifts.imageUrl })
      .from(schema.gifts)
      .where(isNotNull(schema.gifts.imageUrl));

    const pending = rows.flatMap((gift) => {
      if (!gift.imageUrl) return [];
      const source = isLegacyGiftImage(gift.imageUrl);
      return source ? [{ ...gift, source }] : [];
    });

    console.log(`${pending.length} imagem(ns) do Supabase Storage encontradas.`);
    if (!apply) {
      console.log("Simulação concluída. Use --apply para copiar arquivos e atualizar o banco.");
      return;
    }

    for (const gift of pending) {
      const response = await fetch(gift.source);
      if (!response.ok) {
        throw new Error(`Falha ao baixar a imagem do presente ${gift.id} (HTTP ${response.status}).`);
      }

      const contentType = response.headers
        .get("content-type")
        ?.split(";")[0]
        .trim();
      const extension = contentType ? IMAGE_EXTENSIONS[contentType] : undefined;
      if (!contentType || !extension) {
        throw new Error(`Formato de imagem não suportado para o presente ${gift.id}.`);
      }

      const image = new Uint8Array(await response.arrayBuffer());
      if (image.byteLength > MAX_IMAGE_SIZE) {
        throw new Error(`Imagem do presente ${gift.id} excede o limite de 5 MB.`);
      }

      const blob = await put(`gifts/${gift.id}.${extension}`, Buffer.from(image), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType,
        cacheControlMaxAge: 31536000,
      });

      await db
        .update(schema.gifts)
        .set({ imageUrl: blob.url })
        .where(eq(schema.gifts.id, gift.id));

      console.log(`Imagem do presente ${gift.id} migrada.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "[storage:migrate]",
    error instanceof Error ? error.message : "Falha inesperada.",
  );
  process.exitCode = 1;
});