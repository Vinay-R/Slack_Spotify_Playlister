"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConnectionCard } from "@/components/ConnectionCard";
import { Hash, Music } from "lucide-react";

interface Status {
  slack: { connected: boolean; teamName?: string };
  spotify: { connected: boolean; displayName?: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "The authorization link expired. Please try again.",
  server_misconfigured: "Server configuration error. Please contact support.",
  auth_failed: "Authentication failed. Please try again.",
  slack_authorization_failed: "Slack authorization was denied or failed.",
  token_exchange_failed: "Could not complete Slack authorization. Please try again.",
  spotify_token_exchange_failed: "Could not complete Spotify authorization. Please try again.",
  spotify_authorization_failed: "Spotify authorization was denied or failed.",
  spotify_profile_fetch_failed: "Could not fetch your Spotify profile. Please try again.",
  spotify_connection_failed: "Spotify connection failed. Please try again.",
};

function ConnectContent() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const slackConnected = searchParams.get("slack") === "connected";
  const spotifyConnected = searchParams.get("spotify") === "connected";
  const errorCode = searchParams.get("error");
  const error = errorCode
    ? ERROR_MESSAGES[errorCode] || "Something went wrong. Please try again."
    : null;

  function refreshStatus() {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <div className="space-y-10">
      <div className="fade-in-up stagger-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Connect Services
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Link your Slack workspace and Spotify account to get started.
        </p>
      </div>

      {(slackConnected || spotifyConnected) && (
        <div className="fade-in rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {slackConnected && "Slack workspace connected successfully!"}
          {spotifyConnected && "Spotify account connected successfully!"}
        </div>
      )}

      {error && (
        <div className="fade-in rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl bg-secondary/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 fade-in-up stagger-2">
          <ConnectionCard
            title="Slack"
            description="Access your workspace channels and messages"
            icon={<Hash className="h-5 w-5" />}
            connected={status?.slack.connected || false}
            detail={status?.slack.teamName}
            connectHref="/api/auth/slack"
            disconnectHref="/api/auth/slack"
            onDisconnect={refreshStatus}
          />
          <ConnectionCard
            title="Spotify"
            description="Create and manage playlists in your account"
            icon={<Music className="h-5 w-5" />}
            connected={status?.spotify.connected || false}
            detail={status?.spotify.displayName}
            connectHref="/api/auth/spotify"
            disconnectHref="/api/auth/spotify"
            onDisconnect={refreshStatus}
          />
        </div>
      )}

      <div className="fade-in-up stagger-3 rounded-xl border border-border/50 bg-card p-6">
        <h2 className="font-heading text-base font-semibold">How it works</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Connect accounts",
              desc: "Link your Slack workspace and Spotify account above.",
            },
            {
              step: "2",
              title: "Select channels",
              desc: "Choose which Slack channels to scan for Spotify links.",
            },
            {
              step: "3",
              title: "Create playlists",
              desc: "A Spotify playlist is created for each channel, populated with shared tracks.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {step}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-xl bg-secondary/50"
            />
          ))}
        </div>
      }
    >
      <ConnectContent />
    </Suspense>
  );
}
