# Security Checklist

A comprehensive security checklist for web applications with OAuth integrations, encrypted token storage, and third-party API access. Derived from a full audit of a Next.js + Supabase + Prisma application with Slack and Spotify OAuth.

---

## Table of Contents

- [1. Token Storage and Encryption](#1-token-storage-and-encryption)
- [2. OAuth Flow Security](#2-oauth-flow-security)
- [3. Redirect URI and Open Redirect Protection](#3-redirect-uri-and-open-redirect-protection)
- [4. Session and Cookie Security](#4-session-and-cookie-security)
- [5. User Data Isolation and Access Control](#5-user-data-isolation-and-access-control)
- [6. Database Guardrails](#6-database-guardrails)
- [7. Token Scope Minimization](#7-token-scope-minimization)
- [8. Token Refresh Handling](#8-token-refresh-handling)
- [9. Disconnect and Revocation](#9-disconnect-and-revocation)
- [10. Route Authorization Review](#10-route-authorization-review)
- [11. IDOR (Insecure Direct Object Reference)](#11-idor-insecure-direct-object-reference)
- [12. Secret-Safe Logging](#12-secret-safe-logging)
- [13. Input Validation and Sanitization](#13-input-validation-and-sanitization)
- [14. Frontend Error Handling](#14-frontend-error-handling)
- [15. XSS Prevention](#15-xss-prevention)
- [16. Security Headers](#16-security-headers)
- [17. CORS Configuration](#17-cors-configuration)
- [18. Rate Limiting](#18-rate-limiting)
- [19. Secrets Management](#19-secrets-management)
- [20. Dependency Audit](#20-dependency-audit)
- [21. Database Indexing](#21-database-indexing)
- [22. Background Jobs and Async Workers](#22-background-jobs-and-async-workers)
- [23. Webhook and Internal Endpoint Protection](#23-webhook-and-internal-endpoint-protection)
- [24. Infrastructure Isolation](#24-infrastructure-isolation)
- [25. Manual Adversarial Testing](#25-manual-adversarial-testing)
- [26. Grep Patterns for Security Review](#26-grep-patterns-for-security-review)

---

## 1. Token Storage and Encryption

**Goal:** Never store OAuth access tokens or refresh tokens in plaintext.

### Checklist

- [ ] All access tokens encrypted at rest (AES-256-GCM or equivalent)
- [ ] All refresh tokens encrypted at rest
- [ ] Encryption uses a unique IV per encryption operation
- [ ] Encryption key stored in environment variables, never in code
- [ ] Encryption key validated at server startup (fail fast if missing or malformed)
- [ ] Key version field stored alongside ciphertext for future key rotation
- [ ] Legacy plaintext columns default to empty string and are guarded against writes
- [ ] Backfill migration script exists for encrypting existing plaintext rows
- [ ] Centralized encrypt/decrypt functions (no ad-hoc crypto scattered in code)
- [ ] Centralized token read/write services (e.g., `saveSlackToken()` / `getSlackToken()`)
- [ ] No code path reads plaintext token columns after migration

### Implementation Pattern

```
Encrypted payload format: v1.<base64-iv>.<base64-ciphertext>.<base64-auth-tag>
Algorithm: AES-256-GCM
IV: 12 bytes, cryptographically random per operation
Key: 32 bytes from TOKEN_ENCRYPTION_KEY env var (64 hex chars)
```

### Key Files (example)

- `src/lib/crypto.ts` -- encrypt/decrypt/isEncrypted utilities
- `src/lib/slack-token.ts` -- centralized Slack token CRUD
- `src/lib/spotify-token.ts` -- centralized Spotify token CRUD
- `src/instrumentation.ts` -- startup key validation
- `scripts/backfill-encrypt-tokens.ts` -- one-time migration

---

## 2. OAuth Flow Security

**Goal:** Prevent CSRF, session fixation, and account-linking attacks in OAuth flows.

### Checklist

- [ ] State parameter is cryptographically random (128+ bits of entropy)
- [ ] State is HMAC-signed with a server-side secret (not just random -- also tamper-proof)
- [ ] State embeds the authenticated user ID (binds OAuth completion to the user who started it)
- [ ] State has a short TTL (10 minutes or less)
- [ ] State signature uses timing-safe comparison (`crypto.timingSafeEqual`)
- [ ] Callback verifies state before any token exchange
- [ ] Callback rejects missing, malformed, expired, or tampered state
- [ ] OAuth authorization codes are exchanged server-side only (never client-side)
- [ ] Client secrets are never exposed to the browser
- [ ] Error redirects use generic error codes, not raw provider error strings

### Implementation Pattern

```
State format: <base64url-payload>.<hex-hmac-signature>
Payload: { userId, nonce: crypto.randomBytes(16), ts: Date.now() }
Verification: HMAC recomputed + timingSafeEqual + TTL check
```

### Optional Enhancement

- [ ] Single-use enforcement (store used nonces in DB/Redis, reject replays)

---

## 3. Redirect URI and Open Redirect Protection

**Goal:** Prevent attackers from hijacking OAuth callbacks or redirecting users to malicious sites.

### Checklist

- [ ] All OAuth redirect URIs are hardcoded from environment variables (never user-supplied)
- [ ] No `redirect=`, `returnTo=`, `callbackUrl=`, or `next=` params that accept arbitrary URLs
- [ ] If a `next=` param exists, validate: starts with `/`, does not start with `//`, does not contain `\`
- [ ] Error pages do not chain redirects to arbitrary domains
- [ ] OAuth callback URLs are registered with providers exactly (no wildcards)
- [ ] Callback URLs are environment-specific (different for prod, preview, local)

### Implementation Pattern

```typescript
const safePath =
  next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "/";
```

---

## 4. Session and Cookie Security

**Goal:** Ensure authentication state is securely managed and properly invalidated.

### Checklist

- [ ] Auth cookies use `SameSite=Lax` or `Strict`
- [ ] Auth cookies use `Secure` flag in production (HTTPS only)
- [ ] `HttpOnly` set where possible (note: Supabase SSR requires JS access to cookies)
- [ ] Session expiration configured (access token TTL + refresh token TTL)
- [ ] Logout invalidates sessions server-side (not just client-side cookie clearing)
- [ ] Server-side logout endpoint exists as a fallback
- [ ] No sensitive auth material in `localStorage` (only UI preferences)
- [ ] Session tokens are not exposed in URLs
- [ ] Token refresh handled in middleware on every request

### Implementation Pattern

- Client-side logout calls `POST /api/auth/signout` first, then client-side `signOut()`
- Middleware refreshes sessions on every request via `supabase.auth.getUser()`

---

## 5. User Data Isolation and Access Control

**Goal:** Every database query on user-owned data must be scoped to the authenticated user.

### Checklist

- [ ] Every API route calls `getUser()` (or equivalent) first
- [ ] Every query on user-owned models includes `where: { userId: user.id }`
- [ ] Application-level query guards enforce userId presence (e.g., Prisma `$extends`)
- [ ] Guards cover all read operations: `findFirst`, `findMany`, `findUnique`, `count`
- [ ] Composite unique constraints include `userId` (e.g., `@@unique([userId, teamId])`)
- [ ] Delete/update operations verify ownership via a prior read before mutating
- [ ] Multi-connection lookups use deterministic ordering (`orderBy: { createdAt: "desc" }`)

### Implementation Pattern (Prisma Extensions)

```typescript
function userIdGuard(model: string, action: string) {
  return async ({ args, query }) => {
    assertHasUserId(args.where, model, action);
    return query(args);
  };
}
```

---

## 6. Database Guardrails

**Goal:** Prevent accidental data leaks even if application code has a bug.

### Checklist

- [ ] Application-level RLS via ORM extensions/middleware (userId enforcement on queries)
- [ ] Write guards prevent accidental plaintext token storage
- [ ] Composite unique constraints prevent cross-user data collisions
- [ ] Cascading deletes properly configured for parent-child relationships
- [ ] Consider database-level RLS policies (Supabase/Postgres) for defense-in-depth
- [ ] Service-role queries isolated from user-context queries

---

## 7. Token Scope Minimization

**Goal:** Request only the OAuth scopes your application actually needs.

### Checklist

- [ ] Slack: only request user scopes needed (e.g., `channels:read`, `channels:history`)
- [ ] Slack: set bot `scope=""` explicitly if no bot token is needed
- [ ] Spotify: only request needed scopes (e.g., `playlist-modify-public`, `user-read-private`)
- [ ] No test/development scopes left in production code
- [ ] Prefer read-only scopes where write access isn't needed
- [ ] Prefer user tokens over bot tokens when accessing user-specific data
- [ ] Document why each scope is needed

---

## 8. Token Refresh Handling

**Goal:** Refresh tokens safely without race conditions, infinite retries, or secret leakage.

### Checklist

- [ ] Check `res.ok` before parsing response JSON (catch 5xx errors cleanly)
- [ ] Add expiry buffer (e.g., 60 seconds) to prevent token expiring between check and API call
- [ ] Add bounded retries (1 retry on transient 5xx, no retry on 4xx)
- [ ] Add concurrent refresh mutex (per-connection lock prevents parallel refreshes)
- [ ] Handle rotated refresh tokens (save new refresh token if provider returns one)
- [ ] Refresh failures do not log token values or raw provider payloads
- [ ] Refresh errors produce clean error messages (not raw JSON parse failures)

### Implementation Pattern

```typescript
const refreshLocks = new Map<string, Promise<string>>();

async function getValidToken(userId: string): Promise<string> {
  const conn = await getToken(userId);
  if (conn.expiresAt > new Date(Date.now() + 60_000)) return conn.accessToken;

  const existing = refreshLocks.get(conn.connectionId);
  if (existing) return existing;

  const promise = doRefresh(conn).finally(() => refreshLocks.delete(conn.connectionId));
  refreshLocks.set(conn.connectionId, promise);
  return promise;
}
```

---

## 9. Disconnect and Revocation

**Goal:** When a user disconnects an integration, tokens are destroyed and side effects stop.

### Checklist

- [ ] Disconnect endpoint exists for each OAuth provider
- [ ] Endpoint verifies user ownership before deleting
- [ ] Best-effort token revocation with provider API (e.g., Slack `auth.revoke`, Spotify token revoke)
- [ ] Database rows deleted (with cascading deletes for child records)
- [ ] Background jobs stop using revoked tokens
- [ ] Reconnect flow does not revive stale/deleted rows
- [ ] UI reflects disconnected state immediately
- [ ] Disconnect button has confirmation dialog

---

## 10. Route Authorization Review

**Goal:** Every API endpoint has explicit authentication and authorization.

### Checklist

- [ ] Create a full endpoint inventory (all API routes + methods)
- [ ] For each route, document: who can call it, what identity is trusted, what data it accesses
- [ ] All data-access routes require authentication (`getUser()`)
- [ ] OAuth initiation and callback routes are intentionally public (but validate state)
- [ ] No unauthenticated admin/internal endpoints
- [ ] Middleware enforces auth on all non-public paths
- [ ] Public path allowlist is explicit and minimal

---

## 11. IDOR (Insecure Direct Object Reference)

**Goal:** Users cannot access or modify other users' data by swapping IDs.

### Checklist

- [ ] All mutations verify ownership (e.g., `findUnique({ where: { id, userId } })` before delete)
- [ ] Path params, query params, and JSON body IDs are never trusted without ownership check
- [ ] Users cannot swap: playlist IDs, workspace IDs, connection IDs, account IDs
- [ ] Users cannot trigger syncs/scans on another user's connections
- [ ] Composite unique keys include `userId` to prevent cross-user collisions

---

## 12. Secret-Safe Logging

**Goal:** No secrets, tokens, or sensitive data in application logs.

### Checklist

- [ ] Never log full OAuth provider responses (they contain tokens)
- [ ] Never log raw API error response bodies (they may contain internal details)
- [ ] Never log redirect URIs in production (only useful in development)
- [ ] Never embed raw provider error text in thrown Error messages
- [ ] Catch blocks log error type/status only, not full error objects with request context
- [ ] No `JSON.stringify(req.body)` or `JSON.stringify(response.data)` in logs
- [ ] Error messages shown to users are generic (mapped through an allowlist)
- [ ] Search codebase for: `console.log`, `console.error`, `JSON.stringify(error`

### Bad

```typescript
console.error("Token exchange failed:", data.error, data); // Leaks full response with tokens
throw new Error(`API failed: ${rawResponseText}`);          // Leaks raw provider payload
```

### Good

```typescript
console.error("Token exchange failed:", data.error);        // Only error code
throw new Error(`API failed (${res.status})`);              // Only status code
```

---

## 13. Input Validation and Sanitization

**Goal:** Validate all user input at API boundaries.

### Checklist

- [ ] Use schema validation (Zod, Yup, etc.) on all POST/PUT request bodies
- [ ] Validate path params and query params where used
- [ ] Reject unexpected fields / extra properties
- [ ] URL parsing uses `new URL()` for safe encoding (not string concatenation)
- [ ] OAuth state parameters validated with HMAC before use
- [ ] Error codes in redirect URLs are from a fixed set (not user-controlled strings)

---

## 14. Frontend Error Handling

**Goal:** Users never see raw stack traces, error objects, or technical error messages.

### Checklist

- [ ] `error.tsx` exists at the app level (Next.js error boundary for page crashes)
- [ ] `global-error.tsx` exists at the root (catches root layout errors, includes own `<html>`/`<body>`)
- [ ] `not-found.tsx` exists (custom 404 page)
- [ ] Every page that fetches data has error state handling (loading, error, success)
- [ ] Interactive components (sync buttons, delete buttons) catch errors and show feedback
- [ ] Error codes from URLs are mapped to human-readable messages via an allowlist
- [ ] No raw `error.message` from API responses shown directly to users
- [ ] Error boundaries offer "Try again" and "Go home" actions

### Error Message Mapping Pattern

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "The authorization link expired. Please try again.",
  slack_authorization_failed: "Slack authorization was denied or failed.",
  // ... map every error code to a human sentence
};

const error = ERROR_MESSAGES[errorCode] || "Something went wrong. Please try again.";
```

---

## 15. XSS Prevention

**Goal:** No user-controlled content can execute scripts in the browser.

### Checklist

- [ ] No `dangerouslySetInnerHTML` anywhere (or only with a proper sanitizer like DOMPurify)
- [ ] No `innerHTML` usage
- [ ] No `eval()` usage
- [ ] All user-supplied content rendered through React's auto-escaping (JSX `{variable}`)
- [ ] URLs rendered in `<a href>` are validated (no `javascript:` or `data:` URIs from DB)
- [ ] Query parameters used in UI are mapped through allowlists, not rendered raw
- [ ] Provider error messages are never rendered directly

---

## 16. Security Headers

**Goal:** Configure browser security policies to prevent clickjacking, MIME sniffing, and other attacks.

### Checklist

- [ ] `Content-Security-Policy` with restrictive `default-src`, `script-src`, `connect-src`, `frame-ancestors 'none'`
- [ ] `X-Frame-Options: DENY` (clickjacking protection)
- [ ] `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] CSP `connect-src` includes all legitimate API domains (Supabase, Spotify, Slack, etc.)
- [ ] CSP `form-action` restricts form submissions to self + OAuth providers
- [ ] Headers applied to all routes via `next.config.ts` `headers()` function

### Implementation (Next.js)

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

## 17. CORS Configuration

**Goal:** Prevent cross-origin requests from unauthorized domains.

### Checklist

- [ ] No wildcard `Access-Control-Allow-Origin: *` on authenticated endpoints
- [ ] If no CORS headers are set, same-origin policy applies by default (usually fine)
- [ ] Credentials only enabled for trusted origins
- [ ] Internal/admin endpoints not exposed cross-origin
- [ ] Preflight responses are correct

---

## 18. Rate Limiting

**Goal:** Prevent abuse, credential stuffing, and API quota exhaustion.

### Checklist

- [ ] Rate limiting on all API routes
- [ ] Stricter limits on auth/OAuth routes (e.g., 10 req/min vs 30 req/min)
- [ ] Per-IP rate limiting at minimum
- [ ] Consider per-user rate limiting for authenticated routes
- [ ] Rate limit responses include `Retry-After` header and `429` status
- [ ] Rate limiter handles distributed/serverless environments (in-memory resets on cold start)
- [ ] For production: use Upstash Redis or Vercel KV for durable distributed rate limiting

### Priority Endpoints for Rate Limiting

1. Login/auth initiation routes
2. OAuth callback endpoints
3. Token refresh endpoints
4. Data import/sync endpoints
5. Any route that triggers external API calls
6. Search/autocomplete endpoints

---

## 19. Secrets Management

**Goal:** No secrets in code, git history, or unscoped environments.

### Checklist

- [ ] `.env` files in `.gitignore` (`.env*` glob)
- [ ] `.env` never committed to git history (verify with `git log --all -p -- '.env*'`)
- [ ] `.env.example` exists with placeholder values and generation instructions
- [ ] No hardcoded secrets in source code (search for API key patterns)
- [ ] Vercel/hosting env vars scoped by environment (production, preview, development)
- [ ] Encryption keys and OAuth secrets are unique per environment
- [ ] Old leaked keys/tokens have been rotated
- [ ] Sensitive Vercel env vars marked as "Sensitive" (redacted in logs)

### Grep Patterns to Search For

```
xox[bpsa]-          # Slack tokens
sk-[a-zA-Z0-9]{20}  # Various API keys
AKIA[0-9A-Z]{16}    # AWS access keys
```

---

## 20. Dependency Audit

**Goal:** No known vulnerabilities in dependencies.

### Checklist

- [ ] Run `npm audit` (or equivalent) regularly
- [ ] Fix all high/critical vulnerabilities
- [ ] Lockfile (`package-lock.json`) committed to repo
- [ ] Review security-critical packages specifically: auth libs, ORM, OAuth SDKs, crypto libs
- [ ] Remove unused dependencies
- [ ] Check for outdated packages with `npm outdated`

---

## 21. Database Indexing

**Goal:** All frequent query patterns have appropriate indexes.

### Checklist

- [ ] Every `userId` lookup has an index (composite unique constraints count if userId is leading column)
- [ ] Foreign key columns have indexes (e.g., `@@index([slackConnectionId])`)
- [ ] Composite unique constraints exist for user-scoped uniqueness (e.g., `@@unique([userId, teamId])`)
- [ ] No missing indexes on columns used in `WHERE`, `JOIN`, or `ORDER BY` clauses

### Note

In PostgreSQL, a composite index `(userId, teamId)` can be used for queries on just `userId` since it is the leading column.

---

## 22. Background Jobs and Async Workers

**Goal:** Background processes respect user scoping, token validity, and retry bounds.

### Checklist

- [ ] Background jobs enforce user/account scoping
- [ ] Jobs do not process revoked or stale tokens
- [ ] Job failures do not expose secrets in logs
- [ ] Retries are bounded (not infinite)
- [ ] Dead-letter / failed-job logs do not dump payloads
- [ ] Client-side auto-sync (if any) uses `localStorage` for preferences, not secrets

---

## 23. Webhook and Internal Endpoint Protection

**Goal:** Webhooks and internal routes are authenticated and protected from replay attacks.

### Checklist

- [ ] Webhook signature validation (if provider supports it)
- [ ] No unauthenticated admin/internal endpoints
- [ ] Replay protection where applicable (nonce or timestamp checking)
- [ ] Secret comparison uses timing-safe comparison
- [ ] Routes are not just "hidden" by obscure names

---

## 24. Infrastructure Isolation

**Goal:** Preview environments do not compromise production data or credentials.

### Checklist

- [ ] Preview deployments use separate OAuth credentials (or at minimum, separate callback URLs)
- [ ] Preview deployments do not point at the production database
- [ ] Preview environments do not have broad real-user data access
- [ ] Supabase redirect URL allowlist is restricted to exact origins (no wildcards)
- [ ] Old database snapshots with plaintext tokens are cleaned up
- [ ] Preview DBs cloned from prod are sanitized of sensitive data

---

## 25. Manual Adversarial Testing

**Goal:** Verify security controls work against real attack scenarios.

### Test Cases

- [ ] Change another user's `playlistId` in API requests
- [ ] Swap `workspaceId`, `userId`, `installationId`, `spotifyAccountId` in requests
- [ ] Replay an OAuth callback with a mismatched or expired state
- [ ] Reuse old callback URLs after code exchange
- [ ] Hit OAuth callback without session/cookie context
- [ ] Inject long or malformed provider errors
- [ ] Spam sync/generate/import endpoints
- [ ] Attempt unauthorized POST/PUT/DELETE from devtools or Postman
- [ ] Test preview deployment against prod-linked accounts

---

## 26. Grep Patterns for Security Review

Run these searches across your codebase to find potential issues:

```bash
# Logging / secret exposure
rg "console\.log|console\.error" --type ts
rg "JSON\.stringify\(error|JSON\.stringify\(req\.body|JSON\.stringify\(response" --type ts
rg "Authorization|accessToken|refreshToken" --type ts

# Dangerous rendering
rg "dangerouslySetInnerHTML|innerHTML|eval\(" --type ts --type tsx

# Redirect handling
rg "redirect\(|searchParams\.get\(" --type ts

# Token / secret patterns
rg "xox[bpsa]-|sk-[a-zA-Z0-9]{20}|AKIA[0-9A-Z]{16}" --type ts --type json
```

---

## Summary Status Key

When using this checklist, mark items as:

- **PASS** -- Verified secure, no changes needed
- **FIXED** -- Was a vulnerability, now remediated
- **N/A** -- Not applicable to this project
- **MANUAL** -- Requires manual/infrastructure verification
- **TODO** -- Needs implementation
