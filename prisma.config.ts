import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7 reads connection URLs from prisma.config.ts instead of schema.prisma.
    // Use DIRECT_URL for CLI operations like db push/migrate, and DATABASE_URL at runtime.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
