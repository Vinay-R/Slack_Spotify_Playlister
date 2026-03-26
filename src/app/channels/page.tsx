"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChannelList } from "@/components/ChannelList";
import { Loader2, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

interface Channel {
  id: string;
  name: string;
  memberCount: number;
  topic: string;
  purpose: string;
  tracked: boolean;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/channels")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setChannels(data.channels);
        setTeamName(data.teamName);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePlaylists = async (channelIds: string[]) => {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    router.push("/playlists");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Loading channels from Slack...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-heading text-base font-medium">
          Could not load channels
        </p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link
          href="/connect"
          className={buttonVariants({ variant: "secondary" })}
        >
          Connect Slack first
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="fade-in-up stagger-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Select Channels
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-lg">
          Choose the Slack channels you want to create Spotify playlists for.
          We&apos;ll scan each channel for Spotify links and build your
          playlists.
        </p>
      </div>

      <div className="fade-in-up stagger-2">
        <ChannelList
          channels={channels}
          teamName={teamName}
          onCreatePlaylists={handleCreatePlaylists}
        />
      </div>
    </div>
  );
}
