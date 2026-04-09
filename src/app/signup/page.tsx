"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disc3, Loader2, CheckCircle2 } from "lucide-react";
import { GoogleIcon } from "@/components/GoogleIcon";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleSignup() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div className="relative flex min-h-[80vh] items-center justify-center -mt-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
        </div>

        <div className="relative w-full max-w-sm scale-in text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold">Check your email</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center -mt-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[40%] h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px]" />
        <div className="absolute right-[30%] top-[35%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[60px]" />
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
            Create account
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Get started with Slacklister
          </p>
        </div>

        <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
          <CardContent className="space-y-4 p-6">
            <Button
              variant="outline"
              className="w-full gap-2.5 h-10 border-border/60 bg-transparent transition-all duration-200 hover:bg-accent/40 hover:border-border"
              onClick={handleGoogleSignup}
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

            <form onSubmit={handleSignup} className="space-y-3">
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
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
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
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-[13px] text-muted-foreground/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
