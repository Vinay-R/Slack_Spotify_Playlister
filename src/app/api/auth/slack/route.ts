import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/connect?error=SLACK_CLIENT_ID+is+not+configured.+Add+it+to+your+.env+file.", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }

  const scopes = ["channels:read", "channels:history"].join(",");
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(url.toString());
}
