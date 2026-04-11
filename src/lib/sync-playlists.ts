import { prisma } from "@/lib/prisma";
import { fetchChannelHistory } from "@/lib/slack";
import { collectTrackUris } from "@/lib/url-parser";
import {
  addTracksToPlaylist,
  checkPlaylistExists,
  createPlaylist,
} from "@/lib/spotify";
import { getSlackToken } from "@/lib/slack-token";

export interface SyncChannelResult {
  channelName: string;
  newTracks: number;
}

export interface SyncResult {
  results: SyncChannelResult[];
}

/**
 * Sync tracked channels for a given user. Fetches new Slack messages,
 * extracts Spotify links, and adds new tracks to the corresponding playlists.
 *
 * If a playlist was deleted, recreates it and does a full channel history re-sync.
 *
 * @param userId - The user's ID (Supabase auth uid)
 * @param channelIds - Optional subset of channel IDs to sync. If omitted, syncs all.
 * @returns Per-channel sync results
 */
export async function syncUserPlaylists(
  userId: string,
  channelIds?: string[]
): Promise<SyncResult> {
  const slack = await getSlackToken(userId).catch(() => null);
  if (!slack) {
    throw new SyncError("No Slack workspace connected", "NO_SLACK");
  }

  let trackedChannels;
  if (channelIds?.length) {
    trackedChannels = await prisma.trackedChannel.findMany({
      where: {
        userId,
        channelId: { in: channelIds },
        NOT: { spotifyPlaylistId: null },
      },
    });
  } else {
    trackedChannels = await prisma.trackedChannel.findMany({
      where: { userId, NOT: { spotifyPlaylistId: null } },
    });
  }

  if (trackedChannels.length === 0) {
    throw new SyncError("No tracked channels to sync", "NO_CHANNELS");
  }

  const results: SyncChannelResult[] = [];

  for (const channel of trackedChannels) {
    let playlistId = channel.spotifyPlaylistId!;
    const stillExists = await checkPlaylistExists(playlistId, userId);
    let tracksAdded = 0;

    if (!stillExists) {
      await prisma.playlistTrack.deleteMany({
        where: { channelId: channel.id },
      });

      const playlist = await createPlaylist(
        `#${channel.channelName}`,
        `Spotify tracks shared in #${channel.channelName} (recreated by Slacklister)`,
        userId
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
        slack.token,
        channel.channelId
      );
      const uniqueUris = await collectTrackUris(fullMessages, userId);

      if (uniqueUris.length > 0) {
        await addTracksToPlaylist(playlistId, uniqueUris, userId);
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
        slack.token,
        channel.channelId,
        oldest
      );

      const uniqueUris = await collectTrackUris(messages, userId);

      const existingTracks = await prisma.playlistTrack.findMany({
        where: { channelId: channel.id },
        select: { trackUri: true },
      });
      const existingSet = new Set(existingTracks.map((t) => t.trackUri));
      const newUris = uniqueUris.filter((u) => !existingSet.has(u));

      if (newUris.length > 0) {
        await addTracksToPlaylist(playlistId, newUris, userId);
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

  return { results };
}

export class SyncError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "SyncError";
    this.code = code;
  }
}
