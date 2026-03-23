-- CreateTable
CREATE TABLE "SlackConnection" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlackConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpotifyConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpotifyConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedChannel" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "slackConnectionId" TEXT NOT NULL,
    "spotifyPlaylistId" TEXT,
    "spotifyPlaylistUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "trackUri" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "slackMessageTs" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackConnection_teamId_key" ON "SlackConnection"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyConnection_userId_key" ON "SpotifyConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedChannel_channelId_key" ON "TrackedChannel"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaylistTrack_trackUri_channelId_key" ON "PlaylistTrack"("trackUri", "channelId");

-- AddForeignKey
ALTER TABLE "TrackedChannel" ADD CONSTRAINT "TrackedChannel_slackConnectionId_fkey" FOREIGN KEY ("slackConnectionId") REFERENCES "SlackConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "TrackedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
