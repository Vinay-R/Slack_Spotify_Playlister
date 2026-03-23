"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SyncButton } from "@/components/SyncButton";
import { Hash, Music, ExternalLink, Clock } from "lucide-react";
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
  channelId,
  channelName,
  teamName,
  spotifyPlaylistUrl,
  trackCount,
  lastSyncedAt,
  onSyncComplete,
}: PlaylistCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Music className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold truncate">{channelName}</span>
            <Badge variant="secondary" className="text-xs shrink-0">
              {teamName}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="h-3.5 w-3.5" />
              {trackCount} track{trackCount !== 1 ? "s" : ""}
            </span>
            {lastSyncedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Synced {timeAgo(lastSyncedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
