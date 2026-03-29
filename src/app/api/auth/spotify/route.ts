import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSignedState } from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";
import { getSpotifyToken } from "@/lib/spotify-token";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL(
        "/connect?error=server_misconfigured",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      )
    );
  }

  const user = await getUser();
  const state = createSignedState(user.id);

  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
  ].join(" ");
  const redirectUri = `${process.env.SPOTIFY_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000"}/api/auth/spotify/callback`;

  const url = new URL("https://accounts.spotify.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}

export async function DELETE() {
  try {
    const user = await getUser();

    const spotify = await getSpotifyToken(user.id).catch(() => null);
    if (!spotify) {
      return NextResponse.json(
        { error: "No Spotify connection found" },
        { status: 404 }
      );
    }

    try {
      await fetch("https://accounts.spotify.com/api/token/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: spotify.refreshToken }),
      });
    } catch {
      // Best-effort revocation; continue with deletion even if Spotify is unreachable
    }

    await prisma.spotifyConnection.delete({
      where: { id: spotify.connectionId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Spotify disconnect error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Spotify" },
      { status: 500 }
    );
  }
}
