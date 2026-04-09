import { getSpotifyToken, updateSpotifyTokens } from "./spotify-token";

const EXPIRY_BUFFER_MS = 60_000;
const refreshLocks = new Map<string, Promise<string>>();

async function getValidToken(userId: string): Promise<string> {
  const conn = await getSpotifyToken(userId);

  if (conn.expiresAt > new Date(Date.now() + EXPIRY_BUFFER_MS)) {
    return conn.accessToken;
  }

  const existing = refreshLocks.get(conn.connectionId);
  if (existing) return existing;

  const refreshPromise = doRefresh(conn).finally(() => {
    refreshLocks.delete(conn.connectionId);
  });
  refreshLocks.set(conn.connectionId, refreshPromise);
  return refreshPromise;
}

async function doRefresh(conn: {
  connectionId: string;
  refreshToken: string;
}): Promise<string> {
  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: conn.refreshToken,
        }),
      });

      if (!res.ok) {
        const isRetryable = res.status >= 500;
        lastError = new Error(`Spotify refresh failed (${res.status})`);
        if (!isRetryable) throw lastError;
        continue;
      }

      const data = await res.json();
      if (data.error) throw new Error(`Spotify refresh failed: ${data.error}`);

      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      await updateSpotifyTokens({
        connectionId: conn.connectionId,
        accessToken: data.access_token,
        refreshToken: data.refresh_token || undefined,
        expiresAt,
      });

      return data.access_token;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0 && lastError.message.includes("(5")) continue;
      throw lastError;
    }
  }

  throw lastError ?? new Error("Spotify refresh failed");
}

export async function createPlaylist(
  name: string,
  description?: string,
  userId?: string
): Promise<{ id: string; url: string }> {
  const token = await getValidToken(userId!);

  const res = await fetch(
    `https://api.spotify.com/v1/me/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description || `Created by Slacklister`,
        public: false,
      }),
    }
  );

  if (!res.ok) {
    console.error("Spotify create playlist error:", res.status);
    throw new Error(`Spotify create playlist failed (${res.status})`);
  }

  const data = await res.json();
  return { id: data.id, url: data.external_urls.spotify };
}

export async function checkPlaylistExists(
  playlistId: string,
  userId?: string
): Promise<boolean> {
  const token = await getValidToken(userId!);
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=id`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.ok;
}

export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[],
  userId?: string
): Promise<void> {
  if (trackUris.length === 0) return;

  const token = await getValidToken(userId!);

  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/items`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: batch }),
      }
    );

    if (!res.ok) {
      console.error("Spotify add tracks error:", res.status);
      throw new Error(`Failed to add tracks (${res.status})`);
    }
  }
}

export async function getAlbumTrackUris(
  albumId: string,
  userId?: string
): Promise<string[]> {
  const token = await getValidToken(userId!);
  const uris: string[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) throw new Error("Failed to get album tracks");

    for (const track of data.items || []) {
      uris.push(track.uri);
    }
    nextUrl = data.next ?? null;
  }

  return uris;
}
