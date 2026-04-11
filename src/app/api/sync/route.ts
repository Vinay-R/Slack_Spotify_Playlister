import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { syncUserPlaylists, SyncError } from "@/lib/sync-playlists";
import { z } from "zod";

const syncBodySchema = z.object({
  channelIds: z.array(z.string().min(1)).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    const parseResult = syncBodySchema.safeParse(await request.json());
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request: channelIds must be an array of strings" },
        { status: 400 }
      );
    }
    const { channelIds } = parseResult.data;

    const result = await syncUserPlaylists(user.id, channelIds);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SyncError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "An error occurred while syncing playlists" },
      { status: 500 }
    );
  }
}
