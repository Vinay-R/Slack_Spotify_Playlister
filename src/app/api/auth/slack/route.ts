import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createSignedState } from "@/lib/oauth-state";
import { prisma } from "@/lib/prisma";
import { getSlackToken } from "@/lib/slack-token";

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

export async function DELETE() {
  try {
    const user = await getUser();

    const slack = await getSlackToken(user.id).catch(() => null);
    if (!slack) {
      return NextResponse.json(
        { error: "No Slack connection found" },
        { status: 404 }
      );
    }

    try {
      await fetch("https://slack.com/api/auth.revoke", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${slack.token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    } catch {
      // Best-effort revocation; continue with deletion even if Slack is unreachable
    }

    await prisma.slackConnection.delete({
      where: { id: slack.connectionId },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Slack disconnect error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect Slack" },
      { status: 500 }
    );
  }
}
