"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disc3, Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/GoogleIcon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center -mt-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
        <div className="absolute left-[30%] top-[30%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[60px]" />
      </div>

      <div className="relative w-full max-w-sm scale-in">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
            style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
          >
            <Disc3 className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to Slack Playlister
          </p>
        </div>

        <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="space-y-4 p-6">
            <Button
              variant="outline"
              className="w-full gap-2.5 h-10 border-border/60 bg-transparent transition-all duration-200 hover:bg-accent/40 hover:border-border"
              onClick={handleGoogleLogin}
              type="button"
            >
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/40" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card/80 px-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/50">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 bg-background/50 border-border/40 placeholder:text-muted-foreground/40 transition-all duration-200 focus:bg-background focus:border-primary/30"
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 bg-background/50 border-border/40 placeholder:text-muted-foreground/40 transition-all duration-200 focus:bg-background focus:border-primary/30"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive fade-in">{error}</p>
              )}
              <Button
                type="submit"
                className="w-full h-10 font-semibold transition-all duration-200 active:scale-[0.98] hover:brightness-110"
                disabled={loading}
              >
                {loading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[13px] text-muted-foreground/70">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
