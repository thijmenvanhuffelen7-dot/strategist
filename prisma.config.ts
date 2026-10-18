import { defineConfig } from "prisma/config";

// De database is één lokaal bestand. Pad is relatief aan de projectmap.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "file:./prisma/strategist.db",
  },
});
