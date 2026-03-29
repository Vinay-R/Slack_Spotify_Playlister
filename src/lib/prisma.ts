import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type QueryArgs = { args: Record<string, unknown>; query: (args: unknown) => unknown };
type WriteArgs = { args: { data?: Record<string, unknown>; create?: Record<string, unknown>; update?: Record<string, unknown> }; query: (args: unknown) => unknown };

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  const base = new PrismaClient({ adapter });

  function tokenGuard(action: string) {
    return async ({ args, query }: WriteArgs) => {
      const targets = action === "upsert"
        ? [args.create, args.update].filter(Boolean)
        : [args.data].filter(Boolean);
      for (const d of targets) assertNoPlaintextTokens(d as Record<string, unknown>);
      return query(args);
    };
  }

  function userIdGuard(model: string, action: string) {
    return async ({ args, query }: QueryArgs) => {
      assertHasUserId(args.where as Record<string, unknown> | undefined, model, action);
      return query(args);
    };
  }

  function connectionModel(model: string) {
    return {
      create: tokenGuard("create"),
      update: tokenGuard("update"),
      upsert: tokenGuard("upsert"),
      findFirst: userIdGuard(model, "findFirst"),
      findMany: userIdGuard(model, "findMany"),
      findUnique: userIdGuard(model, "findUnique"),
      count: userIdGuard(model, "count"),
    };
  }

  const trackedChannelGuards = {
    findFirst: userIdGuard("TrackedChannel", "findFirst"),
    findMany: userIdGuard("TrackedChannel", "findMany"),
    findUnique: userIdGuard("TrackedChannel", "findUnique"),
    count: userIdGuard("TrackedChannel", "count"),
  };

  return base.$extends({
    query: {
      slackConnection: connectionModel("SlackConnection"),
      spotifyConnection: connectionModel("SpotifyConnection"),
      trackedChannel: trackedChannelGuards,
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

/**
 * Application-level RLS: asserts that queries on user-owned models include
 * a userId filter, preventing accidental cross-user data leaks.
 * Checks both direct where.userId and composite keys containing userId.
 */
function assertHasUserId(
  where: Record<string, unknown> | undefined,
  model: string,
  action: string,
) {
  if (!where) {
    throw new Error(
      `SECURITY: ${model}.${action}() called without a where clause. ` +
        "All queries on user-owned models must include a userId filter."
    );
  }

  if ("userId" in where) return;

  for (const value of Object.values(where)) {
    if (value && typeof value === "object" && "userId" in (value as Record<string, unknown>)) {
      return;
    }
  }

  // Relation filter: where: { trackedChannel: { userId } }
  if ("trackedChannel" in where) {
    const rel = where.trackedChannel as Record<string, unknown> | undefined;
    if (rel && "userId" in rel) return;
  }

  throw new Error(
    `SECURITY: ${model}.${action}() called without userId in the where clause. ` +
      "All queries on user-owned models must be scoped to a user."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
