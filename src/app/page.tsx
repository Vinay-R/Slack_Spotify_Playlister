"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SyncButton } from "@/components/SyncButton";
import {
  Hash,
  Music,
  ListMusic,
  ArrowRight,
  Check,
  Disc3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Status {
  slack: { connected: boolean; teamName?: string };
  spotify: { connected: boolean; displayName?: string };
  trackedChannels: number;
  totalTracks: number;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && (
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
      )}
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/30"
        )}
      />
    </span>
  );
}

function EqualiserBars() {
  return (
    <div className="flex items-end gap-[3px] h-5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-primary/60 equaliser-bar"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  const bothConnected = status?.slack.connected && status?.spotify.connected;
  const hasPlaylists = (status?.trackedChannels || 0) > 0;

  const trackCount = useCountUp(status?.totalTracks || 0);
  const channelCount = useCountUp(status?.trackedChannels || 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Disc3
          className="h-8 w-8 text-primary"
          style={{ animation: "spin-slow 2s linear infinite" }}
        />
      </div>
    );
  }

  const subtitle = !bothConnected
    ? "Connect your accounts to get started"
    : !hasPlaylists
      ? "Select channels to start building playlists"
      : `${status?.trackedChannels} channel${status?.trackedChannels !== 1 ? "s" : ""} · ${status?.totalTracks} track${status?.totalTracks !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="fade-in-up stagger-1">
        <h1 className="font-heading text-5xl font-extrabold tracking-tighter sm:text-6xl">
          Slacklister
        </h1>
        <p className="mt-3 text-sm text-muted-foreground font-mono tracking-wide">
          {subtitle}
        </p>
      </div>

      {/* ── Connected with playlists ── */}
      {bothConnected && hasPlaylists && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 fade-in-up stagger-2">
          {/* Hero block */}
          <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-surface-elevated p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-tighter">
                    {trackCount}
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">
                    tracks
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  across{" "}
                  <span className="text-foreground font-medium">
                    {channelCount} channel
                    {(status?.trackedChannels || 0) !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
              <EqualiserBars />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="shadow-[0_0_16px_var(--glow)] rounded-lg">
                <SyncButton label="Sync All" variant="default" />
              </div>
              <Link
                href="/channels"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "gap-2 text-muted-foreground"
                )}
              >
                <Hash className="h-3.5 w-3.5" />
                Add Channels
              </Link>
              <Link
                href="/playlists"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "gap-2 text-muted-foreground"
                )}
              >
                <ListMusic className="h-3.5 w-3.5" />
                View Playlists
              </Link>
            </div>
          </div>

          {/* Connection status + mini stats */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {[
              {
                label: "Slack",
                detail: status?.slack.teamName,
                connected: status?.slack.connected,
              },
              {
                label: "Spotify",
                detail: status?.spotify.displayName,
                connected: status?.spotify.connected,
              },
            ].map((svc) => (
              <div
                key={svc.label}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-elevated px-4 py-3.5"
              >
                <StatusDot active={!!svc.connected} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    {svc.label}
                  </p>
                  <p className="text-sm font-medium truncate">
                    {svc.detail || "---"}
                  </p>
                </div>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-3 mt-auto">
              {[
                { label: "Channels", value: channelCount, icon: Hash },
                { label: "Tracks", value: trackCount, icon: Music },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.06] bg-surface-elevated px-4 py-3"
                >
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground/40 mb-1.5" />
                  <p className="font-mono text-2xl font-bold tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Connected, no playlists ── */}
      {bothConnected && !hasPlaylists && (
        <div className="fade-in-up stagger-2 space-y-6">
          <div className="flex flex-wrap gap-6">
            {[
              { label: "Slack", detail: status?.slack.teamName },
              { label: "Spotify", detail: status?.spotify.displayName },
            ].map((svc) => (
              <div
                key={svc.label}
                className="flex items-center gap-2.5 text-sm"
              >
                <StatusDot active />
                <span className="text-muted-foreground">{svc.label}</span>
                <span className="font-medium">{svc.detail}</span>
              </div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-elevated p-10 sm:p-14">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent" />
            <div className="relative flex flex-col items-center text-center gap-6">
              <Disc3
                className="h-16 w-16 text-primary/50"
                style={{ animation: "spin-slow 4s linear infinite" }}
              />
              <div className="space-y-2 max-w-md">
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  Pick your channels
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Choose which Slack channels to scan for Spotify links.
                  We&apos;ll build a playlist from every track your team has
                  shared.
                </p>
              </div>
              <Link
                href="/channels"
                className={cn(
                  buttonVariants(),
                  "gap-2 mt-2 shadow-[0_0_20px_var(--glow)] transition-all duration-300 hover:shadow-[0_0_30px_var(--glow)]"
                )}
              >
                <Hash className="h-3.5 w-3.5" />
                Select Channels
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Not connected: Onboarding ── */}
      {!bothConnected && (
        <div className="fade-in-up stagger-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-surface-elevated p-10 sm:p-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
            <div className="relative flex flex-col items-center text-center gap-8">
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-full blur-2xl bg-primary/20"
                  style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
                />
                <Disc3
                  className="relative h-16 w-16 text-primary"
                  style={{ animation: "spin-slow 3s linear infinite" }}
                />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  Get started
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Connect your Slack workspace and Spotify account to start
                  creating playlists from your team&apos;s shared music.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-mono">
                {[
                  { n: "1", label: "Slack", done: status?.slack.connected },
                  {
                    n: "2",
                    label: "Spotify",
                    done: status?.spotify.connected,
                  },
                  { n: "3", label: "Pick channels", done: false },
                ].map((step, i) => (
                  <div key={step.n} className="flex items-center gap-3">
                    {i > 0 && (
                      <span className="text-muted-foreground/20 -ml-3 hidden sm:inline">
                        ———
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                        step.done
                          ? "bg-primary text-primary-foreground"
                          : "border border-muted-foreground/20 text-muted-foreground"
                      )}
                    >
                      {step.done ? <Check className="h-3 w-3" /> : step.n}
                    </span>
                    <span
                      className={cn(
                        step.done
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/connect"
                className={cn(
                  buttonVariants(),
                  "gap-2 mt-2 shadow-[0_0_20px_var(--glow)] transition-all duration-300 hover:shadow-[0_0_30px_var(--glow)]"
                )}
              >
                Connect Services
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
