import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listChannels } from "@/lib/slack";

export async function GET() {
  const slack = await prisma.slackConnection.findFirst();
  if (!slack) {
    return NextResponse.json(
      { error: "No Slack workspace connected" },
      { status: 400 }
    );
  }

  try {
    const channels = await listChannels(slack.accessToken);

    const tracked = await prisma.trackedChannel.findMany({
      where: { slackConnectionId: slack.id },
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
