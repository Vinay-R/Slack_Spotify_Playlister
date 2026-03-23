import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const playlists = await prisma.trackedChannel.findMany({
    include: {
      _count: { select: { tracks: true } },
      slackConnection: { select: { teamName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    playlists: playlists.map((p) => ({
      id: p.id,
      channelId: p.channelId,
      channelName: p.channelName,
      teamName: p.slackConnection.teamName,
      spotifyPlaylistId: p.spotifyPlaylistId,
      spotifyPlaylistUrl: p.spotifyPlaylistUrl,
      trackCount: p._count.tracks,
      lastSyncedAt: p.lastSyncedAt,
      createdAt: p.createdAt,
    })),
  });
}
