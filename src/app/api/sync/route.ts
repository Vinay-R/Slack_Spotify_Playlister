import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelHistory } from "@/lib/slack";
import { extractSpotifyLinks, spotifyTrackUri } from "@/lib/url-parser";
import { addTracksToPlaylist, getAlbumTrackUris } from "@/lib/spotify";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { channelIds?: string[] };
  const channelIds = body.channelIds;

  const slack = await prisma.slackConnection.findFirst();
  if (!slack) {
    return NextResponse.json(
      { error: "No Slack workspace connected" },
      { status: 400 }
    );
  }

  let trackedChannels;
  if (channelIds?.length) {
    trackedChannels = await prisma.trackedChannel.findMany({
      where: { channelId: { in: channelIds }, NOT: { spotifyPlaylistId: null } },
    });
  } else {
    trackedChannels = await prisma.trackedChannel.findMany({
      where: { NOT: { spotifyPlaylistId: null } },
    });
  }

  if (trackedChannels.length === 0) {
    return NextResponse.json(
      { error: "No tracked channels to sync" },
      { status: 400 }
    );
  }

  const results: Array<{ channelName: string; newTracks: number }> = [];

  for (const channel of trackedChannels) {
    const oldest = channel.lastSyncedAt
      ? (channel.lastSyncedAt.getTime() / 1000).toString()
      : undefined;

    const messages = await fetchChannelHistory(
      slack.accessToken,
      channel.channelId,
      oldest
    );

    const allTrackUris: string[] = [];
    for (const msg of messages) {
      const links = extractSpotifyLinks(msg.text);
      for (const link of links) {
        if (link.type === "track") {
          allTrackUris.push(spotifyTrackUri(link.id));
        } else if (link.type === "album") {
          const albumTracks = await getAlbumTrackUris(link.id);
          allTrackUris.push(...albumTracks);
        }
      }
    }

    const uniqueUris = [...new Set(allTrackUris)];

    const existingTracks = await prisma.playlistTrack.findMany({
      where: { channelId: channel.id },
      select: { trackUri: true },
    });
    const existingSet = new Set(existingTracks.map((t) => t.trackUri));
    const newUris = uniqueUris.filter((u) => !existingSet.has(u));

    if (newUris.length > 0 && channel.spotifyPlaylistId) {
      await addTracksToPlaylist(channel.spotifyPlaylistId, newUris);
      for (const uri of newUris) {
        await prisma.playlistTrack.upsert({
          where: { trackUri_channelId: { trackUri: uri, channelId: channel.id } },
          update: {},
          create: { trackUri: uri, channelId: channel.id },
        });
      }
    }

    await prisma.trackedChannel.update({
      where: { id: channel.id },
      data: { lastSyncedAt: new Date() },
    });

    results.push({
      channelName: channel.channelName,
      newTracks: newUris.length,
    });
  }

  return NextResponse.json({ results });
}
