# Slack Playlister

Create Spotify playlists from music links shared in your Slack channels. Connect your Slack workspace, pick which channels to watch, and Slack Playlister will build and maintain a Spotify playlist for each one.

## Features

- **Slack OAuth** -- connect any workspace in one click
- **Channel picker** -- search/filter and multi-select channels
- **Backfill scan** -- reads the full history of a channel and extracts every Spotify track & album link
- **Incremental sync** -- re-scan only new messages since the last sync
- **Spotify playlist creation** -- one playlist per channel, named `#channel-name`
- **Duplicate prevention** -- tracks are never added twice

## Prerequisites

You need two developer apps before running:

### 1. Create a Slack App

1. Go to <https://api.slack.com/apps> and click **Create New App > From scratch**
2. Name it (e.g. "Slack Playlister") and select your workspace
3. Under **OAuth & Permissions > Scopes > Bot Token Scopes**, add:
   - `channels:read`
   - `channels:history`
4. Under **OAuth & Permissions > Redirect URLs**, add:
   ```
   http://localhost:3000/api/auth/slack/callback
   ```
5. Copy the **Client ID** and **Client Secret** from **Basic Information**

### 2. Create a Spotify App

1. Go to <https://developer.spotify.com/dashboard> and create a new app
2. Set the **Redirect URI** to:
   ```
   http://localhost:3000/api/auth/spotify/callback
   ```
3. Check **Web API** under the APIs section
4. Copy the **Client ID** and **Client Secret**

## Getting Started

```bash
# Install dependencies
npm install

# Copy and fill in your credentials
cp .env.example .env
# Edit .env with your Slack and Spotify credentials

# Create the database
npx prisma migrate dev

# Start the dev server
npm run dev
```

Open <http://localhost:3000> and follow the on-screen steps:

1. **Connect** your Slack workspace and Spotify account on the `/connect` page
2. **Select channels** on the `/channels` page
3. **Create playlists** -- the app scans each channel and creates a Spotify playlist
4. **Sync** anytime from the `/playlists` page to pull in new tracks

## Tech Stack

- **Next.js** (App Router) + React
- **Tailwind CSS** + shadcn/ui
- **Prisma** + SQLite
- **Slack Web API** (`@slack/web-api`)
- **Spotify Web API** (direct fetch)

## Project Structure

```
src/
  app/
    page.tsx              Dashboard
    connect/page.tsx      OAuth connections
    channels/page.tsx     Channel selector
    playlists/page.tsx    Playlist manager
    api/
      auth/slack/         Slack OAuth flow
      auth/spotify/       Spotify OAuth flow
      channels/           List Slack channels
      playlists/          List tracked playlists
      scan/               Backfill scan
      sync/               Incremental sync
      status/             Connection status
  lib/
    prisma.ts             Database client
    slack.ts              Slack API helpers
    spotify.ts            Spotify API helpers
    url-parser.ts         Spotify URL regex extraction
  components/             UI components
prisma/
  schema.prisma           Database schema
```
