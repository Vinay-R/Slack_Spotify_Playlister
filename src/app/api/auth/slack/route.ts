import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/connect?error=SLACK_CLIENT_ID+is+not+configured.+Add+it+to+your+.env+file.", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000")
    );
  }

  const user = await getUser();

  const statePayload = JSON.stringify({
    userId: user.id,
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const userScopes = ["channels:read", "channels:history"].join(",");
  const redirectUri = `${process.env.SLACK_REDIRECT_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/slack/callback`;

  const url = new URL("https://slack.com/oauth/v2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("user_scope", userScopes);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return NextResponse.redirect(url.toString());
}
