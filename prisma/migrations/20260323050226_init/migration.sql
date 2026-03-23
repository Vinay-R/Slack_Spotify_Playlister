-- CreateTable
CREATE TABLE "SlackConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SpotifyConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TrackedChannel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "slackConnectionId" TEXT NOT NULL,
    "spotifyPlaylistId" TEXT,
    "spotifyPlaylistUrl" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrackedChannel_slackConnectionId_fkey" FOREIGN KEY ("slackConnectionId") REFERENCES "SlackConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackUri" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "slackMessageTs" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlaylistTrack_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TrackedChannel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackConnection_teamId_key" ON "SlackConnection"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyConnection_userId_key" ON "SpotifyConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedChannel_channelId_key" ON "TrackedChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_trackUri_channelId_key" ON "PlaylistTrack"("trackUri", "channelId");
