import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUser();

    const playlists = await prisma.trackedChannel.findMany({
      where: { userId: user.id },
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
  } catch (err) {
    console.error("Playlists GET error:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching playlists" },
      { status: 500 }
    );
  }
}
