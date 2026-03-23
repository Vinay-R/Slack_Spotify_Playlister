import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection (port 5432) for migrations -- pooled connections
    // don't support advisory locks required by Prisma Migrate
    url: process.env["DIRECT_URL"],
  },
});
