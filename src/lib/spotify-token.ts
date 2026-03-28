import { prisma } from "./prisma";
import { encryptSecret, decryptSecret } from "./crypto";

const CURRENT_KEY_VERSION = 1;

/**
 * Encrypt and persist Spotify access + refresh tokens.
 * This is the ONLY function that should write Spotify tokens to the DB.
 */
export async function saveSpotifyToken(params: {
  userId: string;
  spotifyUserId: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}): Promise<void> {
  const { userId, spotifyUserId, displayName, accessToken, refreshToken, expiresAt } = params;

  if (!accessToken) throw new Error("Cannot save empty Spotify access token");
  if (!refreshToken) throw new Error("Cannot save empty Spotify refresh token");

  const encAccess = encryptSecret(accessToken);
  const encRefresh = encryptSecret(refreshToken);

  await prisma.spotifyConnection.upsert({
    where: { userId_spotifyUserId: { userId, spotifyUserId } },
    update: {
      displayName,
      accessTokenEncrypted: encAccess,
      refreshTokenEncrypted: encRefresh,
      tokenKeyVersion: CURRENT_KEY_VERSION,
      expiresAt,
      accessToken: "",
      refreshToken: "",
    },
    create: {
      userId,
      spotifyUserId,
      displayName,
      accessTokenEncrypted: encAccess,
      refreshTokenEncrypted: encRefresh,
      tokenKeyVersion: CURRENT_KEY_VERSION,
      expiresAt,
      accessToken: "",
      refreshToken: "",
    },
  });
}

/**
 * Update only the access token (and optionally refresh token) after a refresh grant.
 * Keeps the rest of the connection intact.
 */
export async function updateSpotifyTokens(params: {
  connectionId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}): Promise<void> {
  const { connectionId, accessToken, refreshToken, expiresAt } = params;

  if (!accessToken) throw new Error("Cannot save empty Spotify access token");

  const data: Record<string, unknown> = {
    accessTokenEncrypted: encryptSecret(accessToken),
    tokenKeyVersion: CURRENT_KEY_VERSION,
    expiresAt,
    accessToken: "",
  };

  if (refreshToken) {
    data.refreshTokenEncrypted = encryptSecret(refreshToken);
    data.refreshToken = "";
  }

  await prisma.spotifyConnection.update({
    where: { id: connectionId },
    data,
  });
}

/**
 * Read and decrypt Spotify tokens for a given user.
 * Returns decrypted tokens ONLY for immediate server-side API use.
 *
 * SECURITY: This is the only code path that produces decrypted Spotify tokens.
 */
export async function getSpotifyToken(userId: string): Promise<{
  connectionId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  const conn = await prisma.spotifyConnection.findFirst({
    where: { userId },
    select: {
      id: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      expiresAt: true,
    },
  });

  if (!conn) {
    throw new Error("No Spotify connection found");
  }

  if (!conn.accessTokenEncrypted || !conn.refreshTokenEncrypted) {
    throw new Error(
      "Spotify connection exists but has no encrypted tokens. " +
        "Run the backfill script: npm run backfill:encrypt"
    );
  }

  return {
    connectionId: conn.id,
    accessToken: decryptSecret(conn.accessTokenEncrypted),
    refreshToken: decryptSecret(conn.refreshTokenEncrypted),
    expiresAt: conn.expiresAt,
  };
}
