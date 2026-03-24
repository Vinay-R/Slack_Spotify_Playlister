import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchChannelHistory } from "@/lib/slack";
import { extractSpotifyLinks, spotifyTrackUri } from "@/lib/url-parser";
import {
  addTracksToPlaylist,
  getAlbumTrackUris,
  checkPlaylistExists,
  createPlaylist,
} from "@/lib/spotify";
import { getUser } from "@/lib/auth";
import { z } from "zod";

const syncBodySchema = z.object({
  channelIds: z.array(z.string().min(1)).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    const parseResult = syncBodySchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request: channelIds must be an array of strings" },
        { status: 400 }
      );
    }
    const { channelIds } = parseResult.data;

    const slack = await prisma.slackConnection.findFirst({
      where: { userId: user.id },
    });
    if (!slack) {
      return NextResponse.json(
        { error: "No Slack workspace connected" },
        { status: 400 }
      );
    }

    let trackedChannels;
    if (channelIds?.length) {
      trackedChannels = await prisma.trackedChannel.findMany({
        where: {
          userId: user.id,
          channelId: { in: channelIds },
          NOT: { spotifyPlaylistId: null },
        },
      });
    } else {
      trackedChannels = await prisma.trackedChannel.findMany({
        where: { userId: user.id, NOT: { spotifyPlaylistId: null } },
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
      let playlistId = channel.spotifyPlaylistId!;
      const stillExists = await checkPlaylistExists(playlistId, user.id);
      let tracksAdded = 0;

      if (!stillExists) {
        await prisma.playlistTrack.deleteMany({
          where: { channelId: channel.id },
        });

        const playlist = await createPlaylist(
          `#${channel.channelName}`,
          `Spotify tracks shared in #${channel.channelName} (recreated by Slack Playlister)`,
          user.id
        );
        playlistId = playlist.id;

        await prisma.trackedChannel.update({
          where: { id: channel.id },
          data: {
            spotifyPlaylistId: playlist.id,
            spotifyPlaylistUrl: playlist.url,
          },
        });

        const fullMessages = await fetchChannelHistory(
          slack.accessToken,
          channel.channelId
        );
        const allUris: string[] = [];
        for (const msg of fullMessages) {
          const links = extractSpotifyLinks(msg.text);
          for (const link of links) {
            if (link.type === "track") {
              allUris.push(spotifyTrackUri(link.id));
            } else if (link.type === "album") {
              const albumTracks = await getAlbumTrackUris(link.id, user.id);
              allUris.push(...albumTracks);
            }
          }
        }
        const uniqueUris = [...new Set(allUris)];

        if (uniqueUris.length > 0) {
          await addTracksToPlaylist(playlistId, uniqueUris, user.id);
          for (const uri of uniqueUris) {
            await prisma.playlistTrack.upsert({
              where: {
                trackUri_channelId: {
                  trackUri: uri,
                  channelId: channel.id,
                },
              },
              update: {},
              create: { trackUri: uri, channelId: channel.id },
            });
          }
        }
        tracksAdded = uniqueUris.length;
      } else {
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
              const albumTracks = await getAlbumTrackUris(link.id, user.id);
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

        if (newUris.length > 0) {
          await addTracksToPlaylist(playlistId, newUris, user.id);
          for (const uri of newUris) {
            await prisma.playlistTrack.upsert({
              where: {
                trackUri_channelId: {
                  trackUri: uri,
                  channelId: channel.id,
                },
              },
              update: {},
              create: { trackUri: uri, channelId: channel.id },
            });
          }
        }
        tracksAdded = newUris.length;
      }

      await prisma.trackedChannel.update({
        where: { id: channel.id },
        data: { lastSyncedAt: new Date() },
      });

      results.push({
        channelName: channel.channelName,
        newTracks: tracksAdded,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "An error occurred while syncing playlists" },
      { status: 500 }
    );
  }
}
