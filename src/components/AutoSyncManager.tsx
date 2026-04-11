"use client";

import { Timer, Clock } from "lucide-react";

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 0) return "just now";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

interface AutoSyncManagerProps {
  lastSyncedAt: string | null;
}

export function AutoSyncManager({ lastSyncedAt }: AutoSyncManagerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Timer className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Auto-Sync</p>
          <p className="text-[11px] text-muted-foreground">
            Server syncs automatically every hour
          </p>
        </div>
      </div>

      {lastSyncedAt && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Last synced {formatTimeAgo(lastSyncedAt)}</span>
        </div>
      )}
    </div>
  );
}
