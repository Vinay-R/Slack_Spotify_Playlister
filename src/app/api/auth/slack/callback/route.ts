import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/connect?error=${error || "no_code"}`, request.url)
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/slack/callback`;

  const body = new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID!,
    client_secret: process.env.SLACK_CLIENT_SECRET!,
    redirect_uri: redirectUri,
  });

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await tokenRes.json();

  if (!data.ok) {
    return NextResponse.redirect(
      new URL(`/connect?error=${data.error}`, request.url)
    );
  }

  await prisma.slackConnection.upsert({
    where: { teamId: data.team.id },
    update: {
      accessToken: data.access_token,
      teamName: data.team.name,
    },
    create: {
      teamId: data.team.id,
      teamName: data.team.name,
      accessToken: data.access_token,
    },
  });

  return NextResponse.redirect(
    new URL("/connect?slack=connected", request.url)
  );
}
