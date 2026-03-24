import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const { id } = await params;

  const channel = await prisma.trackedChannel.findUnique({ where: { id } });
  if (!channel || channel.userId !== user.id) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  await prisma.playlistTrack.deleteMany({ where: { channelId: id } });
  await prisma.trackedChannel.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
