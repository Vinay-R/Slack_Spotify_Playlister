"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";

interface SyncButtonProps {
  channelIds?: string[];
  label?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  onComplete?: (
    results: Array<{ channelName: string; newTracks: number }>
  ) => void;
}

export function SyncButton({
  channelIds,
  label = "Sync",
  variant = "secondary",
  size = "default",
  onComplete,
}: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sync failed");
        return;
      }
      if (onComplete) onComplete(data.results);
    } catch {
      setError("Sync failed — check your connection");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={error ? "destructive" : variant}
        size={size}
        onClick={handleSync}
        disabled={syncing}
        className="gap-1.5 transition-transform duration-150 active:scale-[0.97]"
        title={error || undefined}
      >
        {syncing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {error ? "Retry" : label}
      </Button>
    </div>
  );
}
