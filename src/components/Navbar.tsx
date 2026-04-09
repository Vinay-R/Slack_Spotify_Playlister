"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Music,
  Hash,
  ListMusic,
  Link2,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/connect", label: "Connect", icon: Link2 },
  { href: "/channels", label: "Channels", icon: Hash },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  if (pathname === "/login" || pathname === "/signup") return null;

  async function handleLogout() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch {
      // Fall through to client-side signout
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-heading text-[15px] font-bold tracking-tight"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-110">
            <Music className="h-3.5 w-3.5" />
          </div>
          <span className="hidden sm:inline">Slacklister</span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-lg bg-primary/10" />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {email && (
            <span className="hidden text-xs text-muted-foreground md:inline max-w-[160px] truncate">
              {email}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Sign out"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
