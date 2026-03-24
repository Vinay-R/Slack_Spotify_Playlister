-- SlackConnection: drop old unique on teamId, add userId column, add composite unique
DROP INDEX IF EXISTS "SlackConnection_teamId_key";
ALTER TABLE "SlackConnection" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "SlackConnection_userId_teamId_key" ON "SlackConnection"("userId", "teamId");

-- SpotifyConnection: rename userId -> spotifyUserId, drop old unique, add new userId column, add composite unique
ALTER TABLE "SpotifyConnection" RENAME COLUMN "userId" TO "spotifyUserId";
DROP INDEX IF EXISTS "SpotifyConnection_userId_key";
ALTER TABLE "SpotifyConnection" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "SpotifyConnection_userId_spotifyUserId_key" ON "SpotifyConnection"("userId", "spotifyUserId");

-- TrackedChannel: drop old unique on channelId, add userId column, add composite unique
DROP INDEX IF EXISTS "TrackedChannel_channelId_key";
ALTER TABLE "TrackedChannel" ADD COLUMN "userId" TEXT;
CREATE UNIQUE INDEX "TrackedChannel_userId_channelId_key" ON "TrackedChannel"("userId", "channelId");
