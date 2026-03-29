"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink, Loader2, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  detail?: string;
  connectHref: string;
  disconnectHref?: string;
  onDisconnect?: () => void;
  accentClass?: string;
}

export function ConnectionCard({
  title,
  description,
  icon,
  connected,
  detail,
  connectHref,
  disconnectHref,
  onDisconnect,
  accentClass,
}: ConnectionCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!disconnectHref) return;
    if (!confirm(`Disconnect ${title}? This will remove your connection and any tracked channels.`)) return;

    setDisconnecting(true);
    try {
      const res = await fetch(disconnectHref, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Disconnect failed");
      }
      onDisconnect?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.03]",
        accentClass
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader className="flex flex-row items-center gap-4 pb-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <CardTitle className="font-heading text-base font-semibold">
            {title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant={connected ? "default" : "secondary"}
          className={cn(
            "gap-1 shrink-0 text-[11px]",
            connected && "bg-primary/10 text-primary border border-primary/20"
          )}
        >
          {connected ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <Circle className="h-3 w-3" />
          )}
          {connected ? "Connected" : "Not connected"}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {connected && detail && (
          <p className="mb-3 text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{detail}</span>
          </p>
        )}
        <div className="flex gap-2">
          <a
            href={connectHref}
            className={cn(
              buttonVariants({ variant: connected ? "secondary" : "default" }),
              "flex-1 gap-2 transition-transform duration-150 active:scale-[0.98]"
            )}
          >
            {connected ? "Reconnect" : `Connect ${title}`}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {connected && disconnectHref && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDisconnect}
              disabled={disconnecting}
              title={`Disconnect ${title}`}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              {disconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
