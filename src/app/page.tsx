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
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Disc3 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Slack Playlister
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Automatically create Spotify playlists from music links shared in your
          Slack channels. Connect, select, and listen.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slack
            </CardTitle>
            {status?.slack.connected ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.slack.connected ? status.slack.teamName : "---"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status?.slack.connected ? "Workspace connected" : "Not connected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spotify
            </CardTitle>
            {status?.spotify.connected ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.spotify.connected ? status.spotify.displayName : "---"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {status?.spotify.connected ? "Account connected" : "Not connected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Channels
            </CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.trackedChannels || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Channels tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tracks
            </CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.totalTracks || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Songs in playlists
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {!bothConnected ? (
            <Link href="/connect" className={buttonVariants()}>
              Connect Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : !hasPlaylists ? (
            <Link href="/channels" className={buttonVariants()}>
              <Hash className="mr-2 h-4 w-4" />
              Select Channels
            </Link>
          ) : (
            <>
              <SyncButton label="Sync All Playlists" variant="default" />
              <Link href="/channels" className={buttonVariants({ variant: "secondary" })}>
                <Hash className="mr-2 h-4 w-4" />
                Add Channels
              </Link>
              <Link href="/playlists" className={buttonVariants({ variant: "outline" })}>
                <ListMusic className="mr-2 h-4 w-4" />
                View Playlists
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Getting Started (if not both connected) */}
      {!bothConnected && (
        <Card className="border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Disc3 className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-semibold">Get started</h2>
                <p className="text-muted-foreground">
                  Connect your Slack workspace and Spotify account to start
                  creating playlists from your team&apos;s shared music.
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  {status?.slack.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  Slack
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {status?.spotify.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  Spotify
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
