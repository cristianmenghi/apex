/**
 * Canonical Zod schema for the application config persisted to
 * ~/.pensar/config.json.
 *
 * Source of truth: src/core/config/config.ts (Config interface)
 *
 * All fields are optional with defaults so the schema can parse
 * both fresh installs (empty config) and older configs that lack
 * newer fields.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// App Config Schema
// ---------------------------------------------------------------------------

export const AppConfigSchema = z.object({
  /** Application version (populated at runtime, not persisted) */
  version: z.string().optional(),
  /** OpenAI API key */
  openAiAPIKey: z.string().nullable().optional().default(null),
  /** Anthropic API key */
  anthropicAPIKey: z.string().nullable().optional().default(null),
  /** OpenRouter API key */
  openRouterAPIKey: z.string().nullable().optional().default(null),
  /** Bedrock API key */
  bedrockAPIKey: z.string().nullable().optional().default(null),
  /** Whether user accepted responsible use disclosure */
  responsibleUseAccepted: z.boolean().default(false),
  /** Daytona remote execution API key */
  daytonaAPIKey: z.string().nullable().optional().default(null),
  /** Daytona org ID */
  daytonaOrgId: z.string().nullable().optional().default(null),
  /** Runloop remote execution API key */
  runloopAPIKey: z.string().nullable().optional().default(null),
  /** Local LLM endpoint URL */
  localModelUrl: z.string().nullable().optional().default(null),
  /** Local LLM model name */
  localModelName: z.string().nullable().optional().default(null),
  /** Theme name */
  theme: z.string().optional(),
  /** Theme mode */
  themeMode: z.enum(["dark", "light", "auto"]).optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
