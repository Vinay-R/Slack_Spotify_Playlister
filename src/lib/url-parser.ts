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
