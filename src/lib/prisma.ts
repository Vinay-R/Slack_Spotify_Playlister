import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const base = new PrismaClient({ adapter });

  const guardedModels = {
    async create({ args, query }: { args: { data: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      assertNoPlaintextTokens(args.data);
      return query(args);
    },
    async update({ args, query }: { args: { data?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      if (args.data) assertNoPlaintextTokens(args.data);
      return query(args);
    },
    async upsert({ args, query }: { args: { create: Record<string, unknown>; update?: Record<string, unknown> }; query: (args: unknown) => unknown }) {
      assertNoPlaintextTokens(args.create);
      if (args.update) assertNoPlaintextTokens(args.update);
      return query(args);
    },
  };

  return base.$extends({
    query: {
      slackConnection: guardedModels,
      spotifyConnection: guardedModels,
    },
  });
}

/**
 * Blocks writes that set non-empty plaintext token fields on connection models.
 * All token writes must go through the centralized token services:
 *   - saveSlackToken() / getSlackToken()
 *   - saveSpotifyToken() / getSpotifyToken()
 */
function assertNoPlaintextTokens(data: Record<string, unknown>) {
  for (const field of ["accessToken", "refreshToken"]) {
    if (typeof data[field] === "string" && data[field] !== "") {
      throw new Error(
        `SECURITY: Writing a non-empty plaintext ${field} is blocked. ` +
          "Use the centralized token service (saveSlackToken / saveSpotifyToken) instead."
      );
    }
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
