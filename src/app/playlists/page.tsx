"use client";

import { useEffect, useState, useCallback } from "react";
import { PlaylistCard } from "@/components/PlaylistCard";
import { SyncButton } from "@/components/SyncButton";
import { buttonVariants } from "@/components/ui/button";
import { Loader2, ListMusic } from "lucide-react";
import Link from "next/link";

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

  const fetchPlaylists = useCallback(async () => {
    const res = await fetch("/api/playlists");
    const data = await res.json();
    setPlaylists(data.playlists);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading playlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Playlists</h1>
          <p className="mt-2 text-muted-foreground">
            {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} created from Slack channels.
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

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <ListMusic className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium">No playlists yet</p>
          <p className="text-muted-foreground text-center max-w-md">
            Select some Slack channels to scan for Spotify links and create your first playlists.
          </p>
          <Link href="/channels" className={buttonVariants()}>
            Select Channels
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {playlists.map((p) => (
            <PlaylistCard
              key={p.id}
              id={p.id}
              channelId={p.channelId}
              channelName={p.channelName}
              teamName={p.teamName}
              spotifyPlaylistUrl={p.spotifyPlaylistUrl}
              trackCount={p.trackCount}
              lastSyncedAt={p.lastSyncedAt}
              onSyncComplete={fetchPlaylists}
            />
          ))}
        </div>
      )}
    </div>
  );
}
