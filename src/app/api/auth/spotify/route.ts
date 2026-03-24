import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/connect?error=SPOTIFY_CLIENT_ID+is+not+configured.+Add+it+to+your+.env+file.", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }

  const user = await getUser();

  const statePayload = JSON.stringify({
    userId: user.id,
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const state = Buffer.from(statePayload).toString("base64url");

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
