import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listChannels } from "@/lib/slack";
import { getUser } from "@/lib/auth";
import { getSlackToken } from "@/lib/slack-token";

export async function GET() {
  try {
    const user = await getUser();

    const slack = await getSlackToken(user.id).catch(() => null);
    if (!slack) {
      return NextResponse.json(
        { error: "No Slack workspace connected" },
        { status: 400 }
      );
    }

    const channels = await listChannels(slack.token);

    const tracked = await prisma.trackedChannel.findMany({
      where: { slackConnectionId: slack.connectionId, userId: user.id },
      select: { channelId: true },
    });
    const trackedIds = new Set(tracked.map((t) => t.channelId));

    return NextResponse.json({
      channels: channels.map((ch) => ({
        ...ch,
        tracked: trackedIds.has(ch.id),
      })),
      teamName: slack.teamName ?? "",
    });
  } catch (err) {
    console.error("Channels GET error:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching channels" },
      { status: 500 }
    );
  }
}
