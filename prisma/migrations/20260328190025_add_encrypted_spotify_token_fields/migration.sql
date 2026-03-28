-- AlterTable
ALTER TABLE "SpotifyConnection" ADD COLUMN     "accessTokenEncrypted" TEXT,
ADD COLUMN     "refreshTokenEncrypted" TEXT,
ADD COLUMN     "tokenKeyVersion" INTEGER,
ALTER COLUMN "accessToken" SET DEFAULT '',
ALTER COLUMN "refreshToken" SET DEFAULT '';
