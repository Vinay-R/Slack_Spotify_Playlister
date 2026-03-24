import crypto from "crypto";

const ALGORITHM = "sha256";

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("OAUTH_STATE_SECRET is not configured");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac(ALGORITHM, getSecret())
    .update(payload)
    .digest("hex");
}

export function createSignedState(userId: string): string {
  const payload = JSON.stringify({
    userId,
    nonce: crypto.randomBytes(16).toString("hex"),
    ts: Date.now(),
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

const MAX_STATE_AGE_MS = 10 * 60 * 1000; // 10 minutes

export function verifySignedState(state: string): { userId: string } {
  const dotIndex = state.lastIndexOf(".");
  if (dotIndex === -1) {
    throw new Error("invalid_state");
  }

  const encoded = state.slice(0, dotIndex);
  const signature = state.slice(dotIndex + 1);

  const expected = sign(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("invalid_state");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());

  if (typeof payload.ts === "number" && Date.now() - payload.ts > MAX_STATE_AGE_MS) {
    throw new Error("state_expired");
  }

  if (!payload.userId || typeof payload.userId !== "string") {
    throw new Error("invalid_state");
  }

  return { userId: payload.userId };
}
