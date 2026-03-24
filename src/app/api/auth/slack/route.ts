import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSignedState } from "@/lib/oauth-state";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/connect?error=server_misconfigured", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }

  const user = await getUser();
  const state = createSignedState(user.id);

  const userScopes = ["channels:read", "channels:history"].join(",");
  const redirectUri = `${process.env.SLACK_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("user_scope", userScopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
