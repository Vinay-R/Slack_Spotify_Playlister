-- AlterTable
ALTER TABLE "SlackConnection" ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "slackTokenExpiresAt" TIMESTAMP(3);
