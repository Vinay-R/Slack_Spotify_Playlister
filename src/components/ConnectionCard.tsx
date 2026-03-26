"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  detail?: string;
  connectHref: string;
  accentClass?: string;
}

export function ConnectionCard({
  title,
  description,
  icon,
  connected,
  detail,
  connectHref,
  accentClass,
}: ConnectionCardProps) {
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
        <a
          href={connectHref}
          className={cn(
            buttonVariants({ variant: connected ? "secondary" : "default" }),
            "w-full gap-2 transition-transform duration-150 active:scale-[0.98]"
          )}
        >
          {connected ? "Reconnect" : `Connect ${title}`}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}
