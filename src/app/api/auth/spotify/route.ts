import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSignedState } from "@/lib/oauth-state";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/connect?error=server_misconfigured", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
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
