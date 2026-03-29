"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="text-center space-y-1.5">
        <h2 className="font-heading text-lg font-semibold">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          An unexpected error occurred. Please try again, or go back to the home
          page.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => unstable_retry()}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Try again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
