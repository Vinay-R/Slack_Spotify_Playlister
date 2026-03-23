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
    <Card className={cn("relative overflow-hidden transition-shadow hover:shadow-lg", accentClass)}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 to-primary" />
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge
          variant={connected ? "default" : "secondary"}
          className={cn(
            "gap-1",
            connected && "bg-primary/15 text-primary border border-primary/30"
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
      <CardContent className="pt-2">
        {connected && detail && (
          <p className="mb-4 text-sm text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{detail}</span>
          </p>
        )}
        <a
          href={connectHref}
          className={cn(
            buttonVariants({ variant: connected ? "secondary" : "default" }),
            "w-full"
          )}
        >
          {connected ? "Reconnect" : `Connect ${title}`}
          <ExternalLink className="ml-2 h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
}
