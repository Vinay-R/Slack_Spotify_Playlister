"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Search, Loader2, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  memberCount: number;
  topic: string;
  purpose: string;
  tracked: boolean;
}

interface ChannelListProps {
  channels: Channel[];
  teamName: string;
  onCreatePlaylists: (channelIds: string[]) => Promise<void>;
}

export function ChannelList({
  channels,
  teamName,
  onCreatePlaylists,
}: ChannelListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.topic.toLowerCase().includes(search.toLowerCase()) ||
      ch.purpose.toLowerCase().includes(search.toLowerCase())
  );

  const toggleChannel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const untracked = filtered.filter((ch) => !ch.tracked);
    if (untracked.every((ch) => selected.has(ch.id))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(untracked.map((ch) => ch.id)));
    }
  };

  const handleCreate = async () => {
    if (selected.size === 0) return;
    setCreating(true);
    setError(null);
    try {
      await onCreatePlaylists(Array.from(selected));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create playlists"
      );
    } finally {
      setCreating(false);
    }
  };

  const untrackedFiltered = filtered.filter((ch) => !ch.tracked);
  const allSelected =
    untrackedFiltered.length > 0 &&
    untrackedFiltered.every((ch) => selected.has(ch.id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 transition-all duration-150 focus:border-primary/30"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <Button
            onClick={handleCreate}
            disabled={selected.size === 0 || creating}
            className="gap-2 transition-transform duration-150 active:scale-[0.98]"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Music className="h-3.5 w-3.5" />
            )}
            Create {selected.size > 0 ? `${selected.size} ` : ""}Playlist
            {selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive fade-in">
          {error}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} channel{filtered.length !== 1 ? "s" : ""} in{" "}
        <span className="font-medium text-foreground">{teamName}</span>
      </p>

      <div className="space-y-1">
        {filtered.map((ch, i) => (
          <button
            key={ch.id}
            type="button"
            disabled={ch.tracked}
            onClick={() => !ch.tracked && toggleChannel(ch.id)}
            className={cn(
              "fade-in-up flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
              ch.tracked
                ? "bg-primary/[0.04] cursor-default"
                : selected.has(ch.id)
                  ? "bg-primary/10 ring-1 ring-primary/20"
                  : "hover:bg-accent/50 active:bg-accent/70"
            )}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            {ch.tracked ? (
              <div className="flex h-4 w-4 items-center justify-center">
                <Music className="h-3.5 w-3.5 text-primary" />
              </div>
            ) : (
              <Checkbox
                checked={selected.has(ch.id)}
                onCheckedChange={() => toggleChannel(ch.id)}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Hash className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-sm font-medium">{ch.name}</span>
            {ch.tracked && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Playlist created
              </Badge>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground/60 tabular-nums">
              {ch.memberCount}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {search
            ? "No channels match your search."
            : "No channels found in this workspace."}
        </div>
      )}
    </div>
  );
}
