"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SyncButton } from "@/components/SyncButton";
import {
  Hash,
  Music,
  ExternalLink,
  Clock,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaylistCardProps {
  id: string;
  channelId: string;
  channelName: string;
  teamName: string;
  spotifyPlaylistUrl: string | null;
  trackCount: number;
  lastSyncedAt: string | null;
  onSyncComplete?: () => void;
  onDelete?: () => void;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlaylistCard({
  id,
  channelId,
  channelName,
  teamName,
  spotifyPlaylistUrl,
  trackCount,
  lastSyncedAt,
  onSyncComplete,
  onDelete,
}: PlaylistCardProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Remove #${channelName} playlist tracking? You can re-create it later from the Channels page.`
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      onDelete?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card px-4 py-3.5 transition-all duration-200 hover:border-border hover:bg-card/80 hover:shadow-md hover:shadow-black/[0.03]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-105">
        <Music className="h-5 w-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-sm font-semibold truncate">{channelName}</span>
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 shrink-0"
          >
            {teamName}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 tabular-nums">
            <Music className="h-3 w-3" />
            {trackCount} track{trackCount !== 1 ? "s" : ""}
          </span>
          {lastSyncedAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(lastSyncedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 opacity-70 transition-opacity duration-150 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
        <SyncButton
          channelIds={[channelId]}
          label="Sync"
          size="sm"
          variant="outline"
          onComplete={onSyncComplete ? () => onSyncComplete() : undefined}
        />
        {spotifyPlaylistUrl && (
          <a
            href={spotifyPlaylistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5 transition-transform duration-150 active:scale-[0.97]"
            )}
          >
            Open
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
