import { defineConfig } from "prisma/config";

// DATABASE_URL uit process.env (Vercel injecteert env; lokaal via .env.local via Next.js/shell)
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
