import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server-side signout error:", err);
    return NextResponse.json(
      { error: "Sign out failed" },
      { status: 500 }
    );
  }
}
