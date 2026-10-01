import "server-only";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let cachedDb: PostgresJsDatabase<typeof schema> | undefined;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (cachedDb) return cachedDb;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL nas variáveis de ambiente.");
  }

  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
  });

  cachedDb = drizzle(client, { schema });
  return cachedDb;
}