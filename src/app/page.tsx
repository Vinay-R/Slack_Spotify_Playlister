"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { SyncButton } from "@/components/SyncButton";
import {
  Hash,
  Music,
  ListMusic,
  ArrowRight,
  CheckCircle2,
  Circle,
  Disc3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Status {
  slack: { connected: boolean; teamName?: string };
  spotify: { connected: boolean; displayName?: string };
  trackedChannels: number;
  totalTracks: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const bothConnected = status?.slack.connected && status?.spotify.connected;
  const hasPlaylists = (status?.trackedChannels || 0) > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Disc3 className="h-8 w-8 text-primary" style={{ animation: "spin-slow 2s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="fade-in-up stagger-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Slacklister
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground max-w-xl">
          Automatically create Spotify playlists from music shared in your Slack
          channels. Connect, Select, Listen.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 fade-in-up stagger-2">
        {[
          {
            label: "Slack",
            value: status?.slack.connected ? status.slack.teamName : "---",
            sub: status?.slack.connected ? "Connected" : "Not connected",
            icon: status?.slack.connected ? CheckCircle2 : Circle,
            active: status?.slack.connected,
          },
          {
            label: "Spotify",
            value: status?.spotify.connected
              ? status.spotify.displayName
              : "---",
            sub: status?.spotify.connected ? "Connected" : "Not connected",
            icon: status?.spotify.connected ? CheckCircle2 : Circle,
            active: status?.spotify.connected,
          },
          {
            label: "Channels",
            value: String(status?.trackedChannels || 0),
            sub: "Tracked",
            icon: Hash,
            active: bothConnected && hasPlaylists,
          },
          {
            label: "Tracks",
            value: String(status?.totalTracks || 0),
            sub: "In playlists",
            icon: Music,
            active: bothConnected && hasPlaylists,
          },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="group relative overflow-hidden transition-all duration-200 hover:border-primary/20"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  stat.active ? "text-primary" : "text-muted-foreground/60"
                )}
              />
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="fade-in-up stagger-3 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base font-semibold">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2.5">
          {!bothConnected ? (
            <Link
              href="/connect"
              className={cn(buttonVariants(), "gap-2 transition-transform duration-150 active:scale-[0.98]")}
            >
              Connect Services
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : !hasPlaylists ? (
            <Link
              href="/channels"
              className={cn(buttonVariants(), "gap-2 transition-transform duration-150 active:scale-[0.98]")}
            >
              <Hash className="h-3.5 w-3.5" />
              Select Channels
            </Link>
          ) : (
            <>
              <SyncButton label="Sync All Playlists" variant="default" />
              <Link
                href="/channels"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "gap-2"
                )}
              >
                <Hash className="h-3.5 w-3.5" />
                Add Channels
              </Link>
              <Link
                href="/playlists"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "gap-2"
                )}
              >
                <ListMusic className="h-3.5 w-3.5" />
                View Playlists
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {!bothConnected && (
        <div className="fade-in-up stagger-4 rounded-xl border border-dashed border-border/60 bg-surface/50 p-8">
          <div className="flex flex-col items-center text-center gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              <Disc3 className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="font-heading text-lg font-semibold">
                Get started
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Connect your Slack workspace and Spotify account to start
                creating playlists from your team&apos;s shared music.
              </p>
            </div>
            <div className="flex gap-5 mt-1">
              {[
                { label: "Slack", done: status?.slack.connected },
                { label: "Spotify", done: status?.spotify.connected },
              ].map((svc) => (
                <div
                  key={svc.label}
                  className="flex items-center gap-1.5 text-sm"
                >
                  {svc.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/50" />
                  )}
                  <span
                    className={cn(
                      svc.done
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    {svc.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
