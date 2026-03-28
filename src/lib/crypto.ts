import crypto from "node:crypto";

/**
 * AES-256-GCM authenticated encryption for storing secrets at rest.
 *
 * Encrypted payload format (dot-separated):
 *   v1.<base64url IV>.<base64url ciphertext>.<base64url authTag>
 *
 * The "v1" prefix enables future algorithm upgrades without breaking
 * existing rows — a new version would simply use a different prefix
 * and decryptSecret can branch on it.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // NIST-recommended for GCM
const TAG_BYTES = 16;
const CURRENT_VERSION = "v1";

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes). Got ${hex.length} chars.`
    );
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty or missing plaintext");
  }

  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    CURRENT_VERSION,
    iv.toString("base64url"),
    encrypted.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error("Cannot decrypt empty or missing ciphertext");
  }

  const parts = ciphertext.split(".");
  if (parts.length !== 4) {
    throw new Error(
      "Malformed encrypted payload: expected v1.<iv>.<data>.<tag>"
    );
  }

  const [version, ivB64, dataB64, tagB64] = parts;

  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported encryption version: ${version}`);
  }

  const key = getKey();
  const iv = Buffer.from(ivB64, "base64url");
  const data = Buffer.from(dataB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");

  if (iv.length !== IV_BYTES) {
    throw new Error(`Invalid IV length: expected ${IV_BYTES}, got ${iv.length}`);
  }
  if (tag.length !== TAG_BYTES) {
    throw new Error(`Invalid auth tag length: expected ${TAG_BYTES}, got ${tag.length}`);
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Returns true if the value looks like a v1-encrypted payload
 * (starts with "v1." and has four dot-separated segments).
 * Used by the backfill script to skip already-migrated rows.
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("v1.") && value.split(".").length === 4;
}
