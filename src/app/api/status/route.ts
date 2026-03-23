import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slack = await prisma.slackConnection.findFirst({
      select: { teamName: true, teamId: true, createdAt: true },
    });

    const spotify = await prisma.spotifyConnection.findFirst({
      select: { displayName: true, userId: true, createdAt: true },
    });

    const trackedCount = await prisma.trackedChannel.count();
    const trackCount = await prisma.playlistTrack.count();

    return NextResponse.json({
      slack: slack ? { connected: true, ...slack } : { connected: false },
      spotify: spotify ? { connected: true, ...spotify } : { connected: false },
      trackedChannels: trackedCount,
      totalTracks: trackCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Status API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
