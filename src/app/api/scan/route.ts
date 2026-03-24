import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelHistory } from "@/lib/slack";
import { extractSpotifyLinks, spotifyTrackUri } from "@/lib/url-parser";
import {
  createPlaylist,
  addTracksToPlaylist,
  getAlbumTrackUris,
  checkPlaylistExists,
} from "@/lib/spotify";
import { WebClient } from "@slack/web-api";
import { getUser } from "@/lib/auth";
import { z } from "zod";

const scanBodySchema = z.object({
  channelIds: z.array(z.string().min(1)).min(1, "No channels selected"),
});

async function collectTrackUris(
  messages: Array<{ text: string }>,
  userId: string
): Promise<string[]> {
  const allUris: string[] = [];
  for (const msg of messages) {
    const links = extractSpotifyLinks(msg.text);
    for (const link of links) {
      if (link.type === "track") {
        allUris.push(spotifyTrackUri(link.id));
      } else if (link.type === "album") {
        const albumTracks = await getAlbumTrackUris(link.id, userId);
        allUris.push(...albumTracks);
      }
    }
  }
  return [...new Set(allUris)];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    const parseResult = scanBodySchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request: channelIds must be a non-empty array of strings" },
        { status: 400 }
      );
    }
    const { channelIds } = parseResult.data;

    const slack = await prisma.slackConnection.findFirst({
      where: { userId: user.id },
    });
    if (!slack) {
      return NextResponse.json({ error: "No Slack workspace connected" }, { status: 400 });
    }

    const spotify = await prisma.spotifyConnection.findFirst({
      where: { userId: user.id },
    });
    if (!spotify) {
      return NextResponse.json({ error: "No Spotify account connected" }, { status: 400 });
    }

    const results: Array<{ channelName: string; tracksAdded: number; playlistUrl: string }> = [];
    for (const channelId of channelIds) {
      const messages = await fetchChannelHistory(slack.accessToken, channelId);
      const uniqueUris = await collectTrackUris(messages, user.id);

      const existing = await prisma.trackedChannel.findUnique({
        where: { userId_channelId: { userId: user.id, channelId } },
      });

      const playlistStillExists = existing?.spotifyPlaylistId
        ? await checkPlaylistExists(existing.spotifyPlaylistId, user.id)
        : false;

      if (existing?.spotifyPlaylistId && playlistStillExists) {
        const existingTracks = await prisma.playlistTrack.findMany({
          where: { channelId: existing.id },
          select: { trackUri: true },
        });
        const existingSet = new Set(existingTracks.map((t) => t.trackUri));
        const newUris = uniqueUris.filter((u) => !existingSet.has(u));

        if (newUris.length > 0) {
          await addTracksToPlaylist(existing.spotifyPlaylistId, newUris, user.id);
          for (const uri of newUris) {
            await prisma.playlistTrack.upsert({
              where: { trackUri_channelId: { trackUri: uri, channelId: existing.id } },
              update: {},
              create: { trackUri: uri, channelId: existing.id },
            });
          }
        }

        await prisma.trackedChannel.update({
          where: { id: existing.id },
          data: { lastSyncedAt: new Date() },
        });

        results.push({
          channelName: existing.channelName,
          tracksAdded: newUris.length,
          playlistUrl: existing.spotifyPlaylistUrl || "",
        });
      } else {
        if (existing) {
          await prisma.playlistTrack.deleteMany({ where: { channelId: existing.id } });
        }
        const client = new WebClient(slack.accessToken);
        const info = await client.conversations.info({ channel: channelId });
        const channelName = info.channel?.name || channelId;

        const playlist = await createPlaylist(
          `#${channelName}`,
          `Spotify tracks shared in #${channelName} on ${slack.teamName}`,
          user.id
        );

        const trackedChannel = await prisma.trackedChannel.upsert({
          where: { userId_channelId: { userId: user.id, channelId } },
          update: {
            spotifyPlaylistId: playlist.id,
            spotifyPlaylistUrl: playlist.url,
            lastSyncedAt: new Date(),
          },
          create: {
            userId: user.id,
            channelId,
            channelName,
            slackConnectionId: slack.id,
            spotifyPlaylistId: playlist.id,
            spotifyPlaylistUrl: playlist.url,
            lastSyncedAt: new Date(),
          },
        });

        if (uniqueUris.length > 0) {
          await addTracksToPlaylist(playlist.id, uniqueUris, user.id);
          for (const uri of uniqueUris) {
            await prisma.playlistTrack.upsert({
              where: { trackUri_channelId: { trackUri: uri, channelId: trackedChannel.id } },
              update: {},
              create: { trackUri: uri, channelId: trackedChannel.id },
            });
          }
        }

        results.push({
          channelName,
          tracksAdded: uniqueUris.length,
          playlistUrl: playlist.url,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: "An error occurred while scanning channels" },
      { status: 500 }
    );
  }
}
