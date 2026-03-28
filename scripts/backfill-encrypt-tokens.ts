/**
 * One-time backfill script: encrypts existing plaintext Slack and Spotify tokens.
 *
 * Usage:
 *   npx tsx scripts/backfill-encrypt-tokens.ts              # live run
 *   npx tsx scripts/backfill-encrypt-tokens.ts --dry-run    # preview only
 *
 * Requires TOKEN_ENCRYPTION_KEY to be set in .env (loaded via dotenv).
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { encryptSecret, isEncrypted } from "../src/lib/crypto.js";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;
const KEY_VERSION = 1;

interface Stats {
  scanned: number;
  migrated: number;
  skipped: number;
  failed: number;
}

function newStats(): Stats {
  return { scanned: 0, migrated: 0, skipped: 0, failed: 0 };
}

async function main() {
  const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  });
  const prisma = new PrismaClient({ adapter });

  console.log(`\n=== Token Encryption Backfill ===`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}\n`);

  const slackStats = await migrateSlack(prisma);
  const spotifyStats = await migrateSpotify(prisma);

  console.log(`\n--- Slack Summary ---`);
  printStats(slackStats);
  console.log(`\n--- Spotify Summary ---`);
  printStats(spotifyStats);
  console.log();

  await prisma.$disconnect();
  const totalFailed = slackStats.failed + spotifyStats.failed;
  process.exit(totalFailed > 0 ? 1 : 0);
}

async function migrateSlack(prisma: PrismaClient): Promise<Stats> {
  console.log(`\n-- Slack Connections --`);
  const stats = newStats();
  let cursor: string | undefined;

  while (true) {
    const rows = await prisma.slackConnection.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: { id: true, accessToken: true, accessTokenEncrypted: true },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      stats.scanned++;
      cursor = row.id;

      if (row.accessTokenEncrypted) { stats.skipped++; continue; }
      if (!row.accessToken || row.accessToken === "") {
        console.log(`  SKIP ${row.id}: no plaintext token`);
        stats.skipped++;
        continue;
      }
      if (isEncrypted(row.accessToken)) {
        console.log(`  SKIP ${row.id}: already looks encrypted`);
        stats.skipped++;
        continue;
      }

      try {
        const encrypted = encryptSecret(row.accessToken);
        if (!DRY_RUN) {
          await prisma.slackConnection.update({
            where: { id: row.id },
            data: { accessTokenEncrypted: encrypted, tokenKeyVersion: KEY_VERSION, accessToken: "" },
          });
        }
        stats.migrated++;
        console.log(`  ${DRY_RUN ? "WOULD MIGRATE" : "MIGRATED"} ${row.id}`);
      } catch (err) {
        stats.failed++;
        console.error(`  FAILED ${row.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }
  return stats;
}

async function migrateSpotify(prisma: PrismaClient): Promise<Stats> {
  console.log(`\n-- Spotify Connections --`);
  const stats = newStats();
  let cursor: string | undefined;

  while (true) {
    const rows = await prisma.spotifyConnection.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        accessToken: true,
        refreshToken: true,
        accessTokenEncrypted: true,
        refreshTokenEncrypted: true,
      },
    });
    if (rows.length === 0) break;

    for (const row of rows) {
      stats.scanned++;
      cursor = row.id;

      if (row.accessTokenEncrypted && row.refreshTokenEncrypted) {
        stats.skipped++;
        continue;
      }

      const hasPlaintextAccess = row.accessToken && row.accessToken !== "" && !isEncrypted(row.accessToken);
      const hasPlaintextRefresh = row.refreshToken && row.refreshToken !== "" && !isEncrypted(row.refreshToken);

      if (!hasPlaintextAccess && !hasPlaintextRefresh) {
        console.log(`  SKIP ${row.id}: no plaintext tokens to migrate`);
        stats.skipped++;
        continue;
      }

      try {
        const data: Record<string, unknown> = { tokenKeyVersion: KEY_VERSION };

        if (hasPlaintextAccess) {
          data.accessTokenEncrypted = encryptSecret(row.accessToken);
          data.accessToken = "";
        }
        if (hasPlaintextRefresh) {
          data.refreshTokenEncrypted = encryptSecret(row.refreshToken);
          data.refreshToken = "";
        }

        if (!DRY_RUN) {
          await prisma.spotifyConnection.update({ where: { id: row.id }, data });
        }
        stats.migrated++;
        console.log(`  ${DRY_RUN ? "WOULD MIGRATE" : "MIGRATED"} ${row.id}`);
      } catch (err) {
        stats.failed++;
        console.error(`  FAILED ${row.id}:`, err instanceof Error ? err.message : err);
      }
    }
  }
  return stats;
}

function printStats(s: Stats) {
  console.log(`Rows scanned:  ${s.scanned}`);
  console.log(`Rows migrated: ${s.migrated}`);
  console.log(`Rows skipped:  ${s.skipped}`);
  console.log(`Rows failed:   ${s.failed}`);
}

main().catch((err) => {
  console.error("Backfill fatal error:", err);
  process.exit(1);
});
