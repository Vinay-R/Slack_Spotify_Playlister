import { prisma } from "./prisma";
import { encryptSecret, decryptSecret } from "./crypto";

const CURRENT_KEY_VERSION = 1;

/**
 * Encrypt and persist a Slack access token.
 * This is the ONLY function that should write Slack tokens to the DB.
 *
 * Pass refreshToken + expiresIn when Slack token rotation is enabled
 * (authed_user.refresh_token and authed_user.expires_in from the OAuth response).
 */
export async function saveSlackToken(params: {
  userId: string;
  teamId: string;
  teamName: string;
  plainToken: string;
  plainRefreshToken?: string;
  expiresIn?: number; // seconds
}): Promise<void> {
  const { userId, teamId, teamName, plainToken, plainRefreshToken, expiresIn } = params;

  if (!plainToken) {
    throw new Error("Cannot save empty Slack token");
  }

  const encrypted = encryptSecret(plainToken);
  const encryptedRefresh = plainRefreshToken ? encryptSecret(plainRefreshToken) : undefined;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

  await prisma.slackConnection.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: {
      accessTokenEncrypted: encrypted,
      ...(encryptedRefresh !== undefined && { refreshTokenEncrypted: encryptedRefresh }),
      ...(expiresAt !== undefined && { slackTokenExpiresAt: expiresAt }),
      tokenKeyVersion: CURRENT_KEY_VERSION,
      teamName,
      accessToken: "",
    },
    create: {
      userId,
      teamId,
      teamName,
      accessTokenEncrypted: encrypted,
      refreshTokenEncrypted: encryptedRefresh ?? null,
      slackTokenExpiresAt: expiresAt ?? null,
      tokenKeyVersion: CURRENT_KEY_VERSION,
      accessToken: "",
    },
  });
}

/**
 * Read and decrypt the Slack access token for a given user.
 * Returns the plaintext token ONLY for immediate server-side API use.
 *
 * If the token has expired and a refresh token is stored, automatically
 * refreshes via Slack's token rotation endpoint and persists the new tokens.
 *
 * SECURITY: This is the only code path that produces a decrypted Slack token.
 */
export async function getSlackToken(userId: string): Promise<{
  token: string;
  connectionId: string;
  teamName: string;
}> {
  const slack = await prisma.slackConnection.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      teamId: true,
      teamName: true,
      accessTokenEncrypted: true,
      refreshTokenEncrypted: true,
      slackTokenExpiresAt: true,
    },
  });

  if (!slack) {
    throw new Error("No Slack workspace connected");
  }

  if (!slack.accessTokenEncrypted) {
    throw new Error(
      "Slack connection exists but has no encrypted token. " +
        "Run the backfill script: npm run backfill:encrypt"
    );
  }

  // If token is expired (or expiring within 60s) and we have a refresh token, rotate it.
  const isExpired =
    slack.slackTokenExpiresAt &&
    slack.slackTokenExpiresAt.getTime() - Date.now() < 60_000;

  if (isExpired && slack.refreshTokenEncrypted) {
    const plainRefresh = decryptSecret(slack.refreshTokenEncrypted);
    const newTokens = await refreshSlackToken(plainRefresh);

    await prisma.slackConnection.update({
      where: { id: slack.id },
      data: {
        accessTokenEncrypted: encryptSecret(newTokens.accessToken),
        refreshTokenEncrypted: encryptSecret(newTokens.refreshToken),
        slackTokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
      },
    });

    return {
      token: newTokens.accessToken,
      connectionId: slack.id,
      teamName: slack.teamName,
    };
  }

  return {
    token: decryptSecret(slack.accessTokenEncrypted),
    connectionId: slack.id,
    teamName: slack.teamName,
  };
}

async function refreshSlackToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET");
  }

  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack token refresh failed: ${data.error || "unknown_error"}`);
  }

  const accessToken =
    data.authed_user?.access_token ?? data.access_token ?? data.token;
  const nextRefreshToken =
    data.authed_user?.refresh_token ?? data.refresh_token;
  const expiresIn = data.authed_user?.expires_in ?? data.expires_in;

  if (!accessToken || !nextRefreshToken || !expiresIn) {
    throw new Error("Slack token refresh failed: invalid_response_shape");
  }

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    expiresIn: Number(expiresIn),
  };
}
