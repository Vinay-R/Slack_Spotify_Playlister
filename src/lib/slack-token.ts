import { prisma } from "./prisma";
import { encryptSecret, decryptSecret } from "./crypto";

const CURRENT_KEY_VERSION = 1;

/**
 * Encrypt and persist a Slack access token.
 * This is the ONLY function that should write Slack tokens to the DB.
 */
export async function saveSlackToken(params: {
  userId: string;
  teamId: string;
  teamName: string;
  plainToken: string;
}): Promise<void> {
  const { userId, teamId, teamName, plainToken } = params;

  if (!plainToken) {
    throw new Error("Cannot save empty Slack token");
  }

  const encrypted = encryptSecret(plainToken);

  await prisma.slackConnection.upsert({
    where: { userId_teamId: { userId, teamId } },
    update: {
      accessTokenEncrypted: encrypted,
      tokenKeyVersion: CURRENT_KEY_VERSION,
      teamName,
      accessToken: "",
    },
    create: {
      userId,
      teamId,
      teamName,
      accessTokenEncrypted: encrypted,
      tokenKeyVersion: CURRENT_KEY_VERSION,
      accessToken: "",
    },
  });
}

/**
 * Read and decrypt the Slack access token for a given user.
 * Returns the plaintext token ONLY for immediate server-side API use.
 *
 * SECURITY: This is the only code path that produces a decrypted Slack token.
 * No fallback to the legacy plaintext column — all rows must be migrated
 * via the backfill script before deploying this code.
 */
export async function getSlackToken(userId: string): Promise<{
  token: string;
  connectionId: string;
  teamName: string;
}> {
  const slack = await prisma.slackConnection.findFirst({
    where: { userId },
    select: {
      id: true,
      teamName: true,
      accessTokenEncrypted: true,
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

  return {
    token: decryptSecret(slack.accessTokenEncrypted),
    connectionId: slack.id,
    teamName: slack.teamName,
  };
}
