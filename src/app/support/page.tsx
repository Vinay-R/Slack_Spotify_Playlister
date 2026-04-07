import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Support – Slack Playlister",
  description: "Get help with Slack Playlister.",
};

export default function SupportPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-heading text-3xl font-bold tracking-tight">Support</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Having trouble? We&apos;re here to help. Reach out and we&apos;ll
        respond within 2 business days.
      </p>

      <Card className="mt-8 border-border/40 bg-card/80">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium">Email support</p>
            <a
              href="mailto:slacklister.support@gmail.com"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              slacklister.support@gmail.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
