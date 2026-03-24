import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUser();

    const slack = await prisma.slackConnection.findFirst({
      where: { userId: user.id },
      select: { teamName: true, teamId: true, createdAt: true },
    });

    const spotify = await prisma.spotifyConnection.findFirst({
      where: { userId: user.id },
      select: { displayName: true, spotifyUserId: true, createdAt: true },
    });

    const trackedCount = await prisma.trackedChannel.count({
      where: { userId: user.id },
    });
    const trackCount = await prisma.playlistTrack.count({
      where: { trackedChannel: { userId: user.id } },
    });

    return NextResponse.json({
      slack: slack ? { connected: true, ...slack } : { connected: false },
      spotify: spotify ? { connected: true, ...spotify } : { connected: false },
      trackedChannels: trackedCount,
      totalTracks: trackCount,
    });
  } catch (err) {
    console.error("Status API error:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching status" },
      { status: 500 }
    );
  }
}
