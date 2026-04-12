import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncUserPlaylists } from "@/lib/sync-playlists";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all distinct users who have at least one tracked channel with a playlist.
  // Uses raw SQL because the Prisma userId guard blocks unscoped findMany,
  // and this admin-level cron query intentionally spans all users.
  const userRows = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT "userId" FROM "TrackedChannel" WHERE "spotifyPlaylistId" IS NOT NULL
  `;

  const userIds = userRows.map((r) => r.userId);

  if (userIds.length === 0) {
    return NextResponse.json({
      message: "No users with tracked channels",
      processed: 0,
      failed: 0,
      details: [],
    });
  }

  const details: Array<{
    userId: string;
    status: "ok" | "error";
    channelsSynced?: number;
    totalNewTracks?: number;
    error?: string;
  }> = [];

  for (const userId of userIds) {
    try {
      const result = await syncUserPlaylists(userId);
      details.push({
        userId,
        status: "ok",
        channelsSynced: result.results.length,
        totalNewTracks: result.results.reduce((sum, r) => sum + r.newTracks, 0),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Cron sync failed for user ${userId}:`, message);
      details.push({ userId, status: "error", error: message });
    }
  }

  const processed = details.filter((d) => d.status === "ok").length;
  const failed = details.filter((d) => d.status === "error").length;

  return NextResponse.json({
    message: `Cron sync complete: ${processed} succeeded, ${failed} failed out of ${userIds.length} users`,
    processed,
    failed,
    details,
  });
}
