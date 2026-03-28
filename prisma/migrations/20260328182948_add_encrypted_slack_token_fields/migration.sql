-- AlterTable
ALTER TABLE "SlackConnection" ADD COLUMN     "accessTokenEncrypted" TEXT,
ADD COLUMN     "tokenKeyVersion" INTEGER,
ALTER COLUMN "accessToken" SET DEFAULT '';
