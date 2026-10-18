import { defineConfig } from "prisma/config";

// Lokaal: lees .env.local (Next.js doet dat zelf, de Prisma-CLI niet). Op Vercel staan de variabelen al klaar.
try {
  process.loadEnvFile(".env.local");
} catch {
  // geen .env.local: niets aan de hand
}

// Migraties via de directe verbinding (zonder pooler); Vercel/Neon levert beide varianten.
const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: url ?? "",
  },
});
