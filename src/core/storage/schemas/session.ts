/**
 * Canonical Zod schemas for session-related persisted entities.
 *
 * This is the single source of truth for session schemas. The inline
 * Zod objects (AuthCredentialsObject, ScopeConstraintsObject,
 * OffensiveHeadersConfigObject, OperatorSettingsObject,
 * SessionConfigObject) that were previously in session/index.ts have
 * been removed; session/index.ts now imports from this module.
 *
 * SessionInfoObject in session/index.ts is a re-export of
 * SessionInfoSchema for backward compatibility.
 */

import { z } from "zod";
import { Identifier } from "../../id/id";
import { ToolsetStateSchema } from "../../toolset";

// ---------------------------------------------------------------------------
// Auth Credentials (embedded in session config)
// ---------------------------------------------------------------------------

export const AuthCredentialsSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  loginUrl: z.string().optional(),
  additionalFields: z.record(z.string(), z.string()).optional(),
  apiKey: z.string().optional(),
  tokens: z
    .object({
      bearerToken: z.string().optional(),
      cookies: z.string().optional(),
      sessionToken: z.string().optional(),
      customHeaders: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

// ---------------------------------------------------------------------------
// Scope Constraints (embedded in session config)
// ---------------------------------------------------------------------------

export const ScopeConstraintsSchema = z.object({
  allowedHosts: z.string().array().optional(),
  allowedPorts: z.number().array().optional(),
  strictScope: z.boolean().optional(),
});

export type ScopeConstraints = z.infer<typeof ScopeConstraintsSchema>;

// ---------------------------------------------------------------------------
// Offensive Headers Config (embedded in session config)
// ---------------------------------------------------------------------------

export const OffensiveHeadersConfigSchema = z.object({
  mode: z.enum(["none", "default", "custom"]),
  headers: z.record(z.string(), z.string()).optional(),
});

export type OffensiveHeadersConfig = z.infer<
  typeof OffensiveHeadersConfigSchema
>;

// ---------------------------------------------------------------------------
// Operator Settings (embedded in session config)
// ---------------------------------------------------------------------------

export const OperatorSettingsSchema = z.object({
  initialMode: z.enum(["plan", "manual", "auto"]).default("manual"),
  autoApproveTier: z.number().min(1).max(5).default(2),
  enableSuggestions: z.boolean().default(true),
});

export type OperatorSettings = z.infer<typeof OperatorSettingsSchema>;

// ---------------------------------------------------------------------------
// Session Config
// ---------------------------------------------------------------------------

export const SessionConfigSchema = z.object({
  offensiveHeaders: OffensiveHeadersConfigSchema.optional(),
  sessionType: z.enum(["web-app"]).optional(),
  mode: z.enum(["auto", "driver", "operator"]).optional(),
  outcomeGuidance: z.string().optional(),
  scopeConstraints: ScopeConstraintsSchema.optional(),
  authCredentials: AuthCredentialsSchema.optional(),
  authenticationInstructions: z.string().optional(),
  requestsPerSecond: z.number().optional(),
  operatorSettings: OperatorSettingsSchema.optional(),
  enableCvssScoring: z.boolean().optional(),
  cvssModel: z.string().optional(),
  toolsetState: ToolsetStateSchema.optional(),
  enumerateSubdomains: z.boolean().optional(),
  cwd: z.string().optional(),
});

export type SessionConfig = z.infer<typeof SessionConfigSchema>;

// ---------------------------------------------------------------------------
// Session Info (full on-disk shape)
// ---------------------------------------------------------------------------

export const SessionInfoSchema = z.object({
  id: Identifier.schema("session"),
  name: z.string(),
  version: z.string(),
  targets: z.array(z.string()),
  config: SessionConfigSchema.optional(),
  time: z.object({
    created: z.number(),
    updated: z.number(),
  }),
  rootPath: z.string(),
  logsPath: z.string(),
  findingsPath: z.string(),
  scratchpadPath: z.string(),
  pocsPath: z.string(),
});

export type SessionInfo = z.infer<typeof SessionInfoSchema>;

// ---------------------------------------------------------------------------
// Session Ref (minimal reference for sub-agents that only need paths)
// ---------------------------------------------------------------------------

export const SessionRefSchema = SessionInfoSchema.pick({
  id: true,
  rootPath: true,
  findingsPath: true,
  logsPath: true,
  pocsPath: true,
});

export type SessionRef = z.infer<typeof SessionRefSchema>;
