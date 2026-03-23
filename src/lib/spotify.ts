import { prisma } from "./prisma";

async function getValidToken(): Promise<{ token: string; userId: string }> {
  const conn = await prisma.spotifyConnection.findFirst();
  if (!conn) throw new Error("No Spotify connection found");

  if (conn.expiresAt > new Date()) {
    return { token: conn.accessToken, userId: conn.userId };
  }

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

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

  const data = await res.json();
  if (data.error) throw new Error(`Spotify refresh failed: ${data.error}`);

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await prisma.spotifyConnection.update({
    where: { id: conn.id },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || conn.refreshToken,
      expiresAt,
    },
  });

  return { token: data.access_token, userId: conn.userId };
}

export async function createPlaylist(
  name: string,
  description?: string
): Promise<{ id: string; url: string }> {
  const { token, userId } = await getValidToken();

  const res = await fetch(
    `https://api.spotify.com/v1/users/${userId}/playlists`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description: description || `Created by Slack Playlister`,
        public: false,
      }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(`Spotify create playlist failed: ${data.error.message}`);

  return { id: data.id, url: data.external_urls.spotify };
}

export async function addTracksToPlaylist(
  playlistId: string,
  trackUris: string[]
): Promise<void> {
  if (trackUris.length === 0) return;

  const { token } = await getValidToken();

  // Spotify allows max 100 tracks per request
  for (let i = 0; i < trackUris.length; i += 100) {
    const batch = trackUris.slice(i, i + 100);
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: batch }),
      }
    );

    const data = await res.json();
    if (data.error) {
      throw new Error(`Failed to add tracks: ${data.error.message}`);
    }
  }
}

export async function getAlbumTrackUris(albumId: string): Promise<string[]> {
  const { token } = await getValidToken();
  const uris: string[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (nextUrl) {
    const res: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.error) throw new Error(`Failed to get album tracks: ${data.error.message}`);

    for (const track of data.items || []) {
      uris.push(track.uri);
    }
    nextUrl = data.next ?? null;
  }

  return uris;
}
