-- Backfill any NULL userId rows (delete orphaned data that can't be attributed to a user)
DELETE FROM "PlaylistTrack" WHERE "channelId" IN (
  SELECT "id" FROM "TrackedChannel" WHERE "userId" IS NULL
);
DELETE FROM "TrackedChannel" WHERE "userId" IS NULL;
DELETE FROM "SlackConnection" WHERE "userId" IS NULL;
DELETE FROM "SpotifyConnection" WHERE "userId" IS NULL;

-- Make userId non-nullable on all tables
ALTER TABLE "SlackConnection" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "SpotifyConnection" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "TrackedChannel" ALTER COLUMN "userId" SET NOT NULL;

-- Add missing FK indexes for query performance
CREATE INDEX "TrackedChannel_slackConnectionId_idx" ON "TrackedChannel"("slackConnectionId");
CREATE INDEX "PlaylistTrack_channelId_idx" ON "PlaylistTrack"("channelId");
