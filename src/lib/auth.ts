import { createServerClient } from "@/lib/supabase/server";

export async function getUser(): Promise<{ id: string; email: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { id: user.id, email: user.email! };
}
