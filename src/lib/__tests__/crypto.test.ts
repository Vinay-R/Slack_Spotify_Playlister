import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";
import { encryptSecret, decryptSecret, isEncrypted } from "../crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext token", () => {
    const token = "xoxp-fake-token-value-1234567890";
    const encrypted = encryptSecret(token);
    expect(decryptSecret(encrypted)).toBe(token);
  });

  it("produces different ciphertext for the same plaintext (unique IV)", () => {
    const token = "xoxp-same-token-twice";
    const a = encryptSecret(token);
    const b = encryptSecret(token);
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(token);
    expect(decryptSecret(b)).toBe(token);
  });

  it("encrypted payload has v1 prefix and four segments", () => {
    const enc = encryptSecret("test");
    const parts = enc.split(".");
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("v1");
  });

  it("handles unicode and long tokens", () => {
    const long = "a".repeat(10_000);
    expect(decryptSecret(encryptSecret(long))).toBe(long);

    const unicode = "emoji-token-\u{1F512}";
    expect(decryptSecret(encryptSecret(unicode))).toBe(unicode);
  });
});

describe("decryptSecret error handling", () => {
  it("throws on empty string", () => {
    expect(() => decryptSecret("")).toThrow("empty");
  });

  it("throws on malformed payload (wrong segment count)", () => {
    expect(() => decryptSecret("v1.only-two")).toThrow("Malformed");
  });

  it("throws on unsupported version", () => {
    expect(() => decryptSecret("v99.aaa.bbb.ccc")).toThrow(
      "Unsupported encryption version"
    );
  });

  it("throws on tampered ciphertext", () => {
    const enc = encryptSecret("secret");
    const parts = enc.split(".");
    parts[2] = parts[2].slice(0, -2) + "XX"; // corrupt data segment
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });

  it("throws on tampered auth tag", () => {
    const enc = encryptSecret("secret");
    const parts = enc.split(".");
    parts[3] = parts[3].slice(0, -2) + "XX";
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
});

describe("encryptSecret error handling", () => {
  it("throws on empty plaintext", () => {
    expect(() => encryptSecret("")).toThrow("empty");
  });
});

describe("isEncrypted", () => {
  it("returns true for encrypted payloads", () => {
    const enc = encryptSecret("test");
    expect(isEncrypted(enc)).toBe(true);
  });

  it("returns false for plaintext tokens", () => {
    expect(isEncrypted("xoxp-1234-abcdef")).toBe(false);
    expect(isEncrypted("")).toBe(false);
    expect(isEncrypted("v1.only-two")).toBe(false);
  });
});

describe("key validation", () => {
  it("throws when TOKEN_ENCRYPTION_KEY is missing", () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    try {
      expect(() => encryptSecret("test")).toThrow("TOKEN_ENCRYPTION_KEY");
    } finally {
      process.env.TOKEN_ENCRYPTION_KEY = saved;
    }
  });

  it("throws when TOKEN_ENCRYPTION_KEY is wrong length", () => {
    const saved = process.env.TOKEN_ENCRYPTION_KEY;
    process.env.TOKEN_ENCRYPTION_KEY = "abcd";
    try {
      expect(() => encryptSecret("test")).toThrow("64 hex characters");
    } finally {
      process.env.TOKEN_ENCRYPTION_KEY = saved;
    }
  });
});
