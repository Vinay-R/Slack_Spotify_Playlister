import { updateSession } from "@/lib/supabase/middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";

const API_RATE_LIMIT = 30;       // requests per window
const API_RATE_WINDOW_MS = 60_000; // 1 minute
const AUTH_RATE_LIMIT = 10;       // stricter for OAuth endpoints
const AUTH_RATE_WINDOW_MS = 60_000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    const isAuthRoute = pathname.startsWith("/api/auth/");
    const limit = isAuthRoute ? AUTH_RATE_LIMIT : API_RATE_LIMIT;
    const window = isAuthRoute ? AUTH_RATE_WINDOW_MS : API_RATE_WINDOW_MS;
    const key = `${ip}:${isAuthRoute ? "auth" : "api"}`;

    const result = checkRateLimit(key, limit, window);

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.retryAfterMs || 1000) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
