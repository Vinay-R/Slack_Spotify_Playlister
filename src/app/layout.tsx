import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const heading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const body = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Slacklister",
  description:
    "Create Spotify playlists from Spotify links shared in your Slack channels – Slacklister",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${mono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
            {children}
          </div>
        </main>
        <footer className="border-t border-border/40 py-5">
          <div className="mx-auto max-w-5xl px-5 sm:px-8 flex items-center justify-end gap-4 text-xs text-muted-foreground/50">
            <a
              href="/terms"
              className="hover:text-muted-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="hover:text-muted-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/support"
              className="hover:text-muted-foreground transition-colors"
            >
              Support
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
