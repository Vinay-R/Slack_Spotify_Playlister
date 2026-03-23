"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hash, Search, Loader2, Music } from "lucide-react";

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
    try {
      await onCreatePlaylists(Array.from(selected));
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          <Button
            onClick={handleCreate}
            disabled={selected.size === 0 || creating}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Music className="h-4 w-4" />
            )}
            Create {selected.size > 0 ? `${selected.size} ` : ""}Playlist
            {selected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} channel{filtered.length !== 1 ? "s" : ""} in{" "}
        <span className="font-medium text-foreground">{teamName}</span>
      </p>

      <div className="grid gap-2">
        {filtered.map((ch) => (
          <Card
            key={ch.id}
            className={`cursor-pointer transition-colors ${
              ch.tracked
                ? "border-primary/20 bg-primary/5"
                : selected.has(ch.id)
                  ? "border-primary/40 bg-primary/10"
                  : "hover:bg-accent/50"
            }`}
            onClick={() => !ch.tracked && toggleChannel(ch.id)}
          >
            <CardContent className="flex items-center gap-3 py-3">
              {ch.tracked ? (
                <div className="flex h-5 w-5 items-center justify-center">
                  <Music className="h-4 w-4 text-primary" />
                </div>
              ) : (
                <Checkbox
                  checked={selected.has(ch.id)}
                  onCheckedChange={() => toggleChannel(ch.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{ch.name}</span>
              {ch.tracked && (
                <Badge variant="secondary" className="text-xs">
                  Playlist created
                </Badge>
              )}
              <span className="ml-auto text-xs text-muted-foreground">
                {ch.memberCount} member{ch.memberCount !== 1 ? "s" : ""}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {search
            ? "No channels match your search."
            : "No channels found in this workspace."}
        </div>
      )}
    </div>
  );
}
