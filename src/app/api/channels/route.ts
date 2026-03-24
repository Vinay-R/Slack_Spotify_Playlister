import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listChannels } from "@/lib/slack";
import { getUser } from "@/lib/auth";

export async function GET() {
  const user = await getUser();

  const slack = await prisma.slackConnection.findFirst({
    where: { userId: user.id },
  });
  if (!slack) {
    return NextResponse.json(
      { error: "No Slack workspace connected" },
      { status: 400 }
    );
  }

  try {
    const channels = await listChannels(slack.accessToken);

    const tracked = await prisma.trackedChannel.findMany({
      where: { slackConnectionId: slack.id, userId: user.id },
      select: { channelId: true },
    });
    const trackedIds = new Set(tracked.map((t) => t.channelId));

    return NextResponse.json({
      channels: channels.map((ch) => ({
        ...ch,
        tracked: trackedIds.has(ch.id),
      })),
      teamName: slack.teamName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
