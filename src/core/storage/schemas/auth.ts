/**
 * Canonical Zod schemas for authentication-related persisted entities.
 *
 * Two distinct shapes are persisted:
 *
 * 1. AuthCredentials — credentials stored in session config
 *    (re-exported from session.ts to avoid duplication)
 *
 * 2. AuthData — the on-disk auth-data.json written by
 *    completeAuthentication tool after successful auth flow
 *
 * Source of truth:
 * - src/core/session/index.ts (AuthCredentialsObject)
 * - src/core/agents/offSecAgent/tools/completeAuthentication.ts (auth-data.json shape)
 */

import { z } from "zod";

// Re-export AuthCredentialsSchema from session (single source of truth)
export { AuthCredentialsSchema, type AuthCredentials } from "./session";

// ---------------------------------------------------------------------------
// Auth Data Schema (persisted to <session>/auth/auth-data.json)
// ---------------------------------------------------------------------------

/**
 * Schema for the auth data file written by the completeAuthentication tool.
 * This file is read by other agents/resumed sessions to skip re-authentication.
 */
export const AuthDataSchema = z.object({
  /** Whether authentication was successful */
  authenticated: z.boolean(),
  /** Strategy used: browser, form_post, json_post, basic_auth, bearer, api_key, etc. */
  strategy: z.string(),
  /** Cookie header string (e.g., "name1=value1; name2=value2") */
  cookies: z.string().default(""),
  /** Auth headers to include in requests (e.g., {"Authorization": "Bearer <token>"}) */
  headers: z.record(z.string(), z.string()).default({}),
  /** Summary of the authentication process */
  summary: z.string(),
  /** Target URL/host that was authenticated against */
  target: z.string().default(""),
  /** ISO timestamp when auth data was persisted */
  timestamp: z.string(),
});

export type AuthData = z.infer<typeof AuthDataSchema>;
