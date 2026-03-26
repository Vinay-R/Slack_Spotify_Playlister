export interface SpotifyLink {
  type: "track" | "album";
  id: string;
  url: string;
}

const SPOTIFY_URL_REGEX =
  /https?:\/\/open\.spotify\.com\/(track|album)\/([a-zA-Z0-9]+)(\?[^\s>|]*)?/g;

export function extractSpotifyLinks(text: string): SpotifyLink[] {
  const links: SpotifyLink[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(SPOTIFY_URL_REGEX)) {
    const type = match[1] as "track" | "album";
    const id = match[2];
    const key = `${type}:${id}`;

    if (!seen.has(key)) {
      seen.add(key);
      links.push({ type, id, url: match[0] });
    }
  }

  return links;
}

export function spotifyTrackUri(id: string): string {
  return `spotify:track:${id}`;
}

/**
 * Extracts all unique Spotify track URIs from an array of Slack messages,
 * expanding album links into their individual tracks.
 */
export async function collectTrackUris(
  messages: Array<{ text: string }>,
  userId: string
): Promise<string[]> {
  const { getAlbumTrackUris } = await import("./spotify");
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
