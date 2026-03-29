import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-5 fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
        <FileQuestion className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1.5">
        <h2 className="font-heading text-lg font-semibold">Page not found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
