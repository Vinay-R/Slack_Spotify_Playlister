import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySignedState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const stateParam = request.nextUrl.searchParams.get("state");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/connect?error=${error || "no_code"}`, request.url)
    );
  }

  let userId: string;
  try {
    const verified = verifySignedState(stateParam || "");
    userId = verified.userId;
  } catch {
    return NextResponse.redirect(
      new URL("/connect?error=invalid_state", request.url)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
    return NextResponse.redirect(
      new URL("/connect?error=server_misconfigured", request.url)
    );
  }

  const redirectUri = `${process.env.SPOTIFY_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://127.0.0.1:3000"}/api/auth/spotify/callback`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Spotify token exchange failed:", tokenRes.status, text);
      return NextResponse.redirect(
        new URL(`/connect?error=${encodeURIComponent("spotify_token_error: " + text.slice(0, 100))}`, request.url)
      );
    }

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/connect?error=${tokenData.error}`, request.url)
      );
    }

    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      const text = await profileRes.text();
      console.error("Spotify profile fetch failed:", profileRes.status, text);
      return NextResponse.redirect(
        new URL(`/connect?error=${encodeURIComponent("spotify_profile_error: " + text.slice(0, 100))}`, request.url)
      );
    }

    const profile = await profileRes.json();

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.spotifyConnection.upsert({
      where: {
        userId_spotifyUserId: { userId, spotifyUserId: profile.id },
      },
      update: {
        displayName: profile.display_name || profile.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
      create: {
        userId,
        spotifyUserId: profile.id,
        displayName: profile.display_name || profile.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL("/connect?spotify=connected", request.url)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Spotify OAuth callback error:", msg);
    return NextResponse.redirect(
      new URL(`/connect?error=${encodeURIComponent("token_exchange_failed: " + msg)}`, request.url)
    );
  }
}
