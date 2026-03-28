import { NextRequest, NextResponse } from "next/server";
import { verifySignedState } from "@/lib/oauth-state";
import { saveSlackToken } from "@/lib/slack-token";

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

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error("Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET");
    return NextResponse.redirect(
      new URL("/connect?error=server_misconfigured", request.url)
    );
  }

  const redirectUri = `${process.env.SLACK_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/slack/callback`;

  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    console.log("Slack token exchange redirect_uri:", redirectUri);

    const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await tokenRes.json();

    if (!data.ok) {
      console.error("Slack token exchange failed:", data.error, data);
      return NextResponse.redirect(
        new URL(`/connect?error=${data.error}`, request.url)
      );
    }

    const userToken = data.authed_user?.access_token;
    if (!userToken) {
      return NextResponse.redirect(
        new URL("/connect?error=no_user_token", request.url)
      );
    }

    await saveSlackToken({
      userId,
      teamId: data.team.id,
      teamName: data.team.name,
      plainToken: userToken,
    });

    return NextResponse.redirect(
      new URL("/connect?slack=connected", request.url)
    );
  } catch (err) {
    console.error("Slack OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/connect?error=token_exchange_failed", request.url)
    );
  }
}
