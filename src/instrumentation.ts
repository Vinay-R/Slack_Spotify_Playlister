export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const key = process.env.TOKEN_ENCRYPTION_KEY;
    if (!key) {
      console.error(
        "\n\x1b[31m[FATAL] TOKEN_ENCRYPTION_KEY is not set.\x1b[0m\n" +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"\n"
      );
      process.exit(1);
    }
    if (Buffer.from(key, "hex").length !== 32) {
      console.error(
        "\n\x1b[31m[FATAL] TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).\x1b[0m\n"
      );
      process.exit(1);
    }
    console.log("[startup] TOKEN_ENCRYPTION_KEY validated");
  }
}
