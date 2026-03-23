"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RefreshCw, Clock, Timer } from "lucide-react";

const SYNC_INTERVALS = [
  { label: "Every hour", value: 3600000 },
  { label: "Every 12 hours", value: 43200000 },
  { label: "Every day", value: 86400000 },
  { label: "Every week", value: 604800000 },
  { label: "Off", value: 0 },
] as const;

const STORAGE_KEY = "slack-playlister-sync-interval";
const DEFAULT_INTERVAL = 86400000; // 1 day

function formatTimeUntil(ms: number): string {
  if (ms <= 0) return "now";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

interface AutoSyncManagerProps {
  lastSyncedAt: string | null;
  onSyncTriggered: () => void;
}

export function AutoSyncManager({ lastSyncedAt, onSyncTriggered }: AutoSyncManagerProps) {
  const [interval, setIntervalValue] = useState<number>(DEFAULT_INTERVAL);
  const [syncing, setSyncing] = useState(false);
  const [nextSyncIn, setNextSyncIn] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIntervalValue(Number(stored));
    }
  }, []);

  const runSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        onSyncTriggered();
      }
    } finally {
      setSyncing(false);
      syncingRef.current = false;
    }
  }, [onSyncTriggered]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    timerRef.current = null;
    countdownRef.current = null;
    setNextSyncIn(null);

    if (interval === 0) return;

    const lastSync = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
    const timeSinceLastSync = Date.now() - lastSync;

    if (timeSinceLastSync >= interval) {
      runSync();
    }

    const msUntilNext = Math.max(0, interval - timeSinceLastSync);
    setNextSyncIn(msUntilNext);

    const syncTimer = setTimeout(() => {
      runSync();
      timerRef.current = setInterval(runSync, interval);
    }, msUntilNext);

    countdownRef.current = setInterval(() => {
      const last = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;
      const remaining = Math.max(0, interval - (Date.now() - last));
      setNextSyncIn(remaining);
    }, 30000);

    return () => {
      clearTimeout(syncTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [interval, lastSyncedAt, runSync]);

  function handleIntervalChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = Number(e.target.value);
    setIntervalValue(val);
    localStorage.setItem(STORAGE_KEY, String(val));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Timer className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Auto-Sync</p>
          <p className="text-xs text-muted-foreground">
            {interval === 0 ? (
              "Disabled — sync manually"
            ) : syncing ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing now...
              </span>
            ) : nextSyncIn !== null ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Next sync in {formatTimeUntil(nextSyncIn)}
              </span>
            ) : (
              "Waiting..."
            )}
          </p>
        </div>
      </div>

      <select
        value={interval}
        onChange={handleIntervalChange}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {SYNC_INTERVALS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
