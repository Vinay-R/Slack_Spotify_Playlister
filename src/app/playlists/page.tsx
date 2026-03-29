"use client";

import { useEffect, useState, useCallback } from "react";
import { PlaylistCard } from "@/components/PlaylistCard";
import { SyncButton } from "@/components/SyncButton";
import { AutoSyncManager } from "@/components/AutoSyncManager";
import { buttonVariants } from "@/components/ui/button";
import { Loader2, ListMusic, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Playlist {
  id: string;
  channelId: string;
  channelName: string;
  teamName: string;
  spotifyPlaylistId: string | null;
  spotifyPlaylistUrl: string | null;
  trackCount: number;
  lastSyncedAt: string | null;
  createdAt: string;
}

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await fetch("/api/playlists");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load playlists");
      setPlaylists(data.playlists);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load playlists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 fade-in">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-heading text-base font-medium">
          Could not load playlists
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
            fetchPlaylists();
          }}
          className={cn(buttonVariants({ variant: "secondary" }))}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between fade-in-up stagger-1">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Your Playlists
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}{" "}
            created from Slack channels.
          </p>
        </div>
        {playlists.length > 0 && (
          <SyncButton
            label="Sync All"
            variant="default"
            onComplete={fetchPlaylists}
          />
        )}
      </div>

      {playlists.length > 0 && (
        <div className="fade-in-up stagger-2">
          <AutoSyncManager
            lastSyncedAt={playlists.reduce<string | null>((latest, p) => {
              if (!p.lastSyncedAt) return latest;
              if (!latest) return p.lastSyncedAt;
              return p.lastSyncedAt > latest ? p.lastSyncedAt : latest;
            }, null)}
            onSyncTriggered={fetchPlaylists}
          />
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <ListMusic className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-heading text-base font-medium">
            No playlists yet
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Select some Slack channels to scan for Spotify links and create your
            first playlists.
          </p>
          <Link
            href="/channels"
            className={cn(
              buttonVariants(),
              "transition-transform duration-150 active:scale-[0.98]"
            )}
          >
            Select Channels
          </Link>
        </div>
      ) : (
        <div className="space-y-2 fade-in-up stagger-3">
          {playlists.map((p, i) => (
            <div
              key={p.id}
              className="fade-in-up"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <PlaylistCard
                id={p.id}
                channelId={p.channelId}
                channelName={p.channelName}
                teamName={p.teamName}
                spotifyPlaylistUrl={p.spotifyPlaylistUrl}
                trackCount={p.trackCount}
                lastSyncedAt={p.lastSyncedAt}
                onSyncComplete={fetchPlaylists}
                onDelete={fetchPlaylists}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
