import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSignedState } from "@/lib/oauth-state";

export async function GET() {
  const baseUrl =
    process.env.SLACK_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    console.error("Missing SLACK_CLIENT_ID env var");
    return NextResponse.redirect(
      new URL("/connect?error=server_misconfigured", baseUrl)
    );
  }

  try {
    const user = await getUser();
    const state = createSignedState(user.id);

    const userScopes = ["channels:read", "channels:history"].join(",");
    const redirectUri = `${baseUrl}/api/auth/slack/callback`;

    console.log("Slack OAuth redirect_uri:", redirectUri);

    const url = new URL("https://slack.com/oauth/v2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", "");
    url.searchParams.set("user_scope", userScopes);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);

    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("Slack OAuth initiation error:", err);
    return NextResponse.redirect(
      new URL("/connect?error=auth_failed", baseUrl)
    );
  }
}
