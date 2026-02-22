/**
 * Config Repository
 *
 * Encapsulates all I/O for the application config stored at
 * `~/.pensar/config.json`. Handles env-var overlays, defaults for
 * missing files, and merge-on-update semantics.
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import { getBaseDir } from "../base";
import { AppConfigSchema, type AppConfig } from "../schemas/config";

export interface ConfigRepository {
  /**
   * Read the application config. Returns defaults if the file is
   * missing. Applies environment variable overlays for API keys.
   */
  get(): Promise<AppConfig>;

  /**
   * Merge partial updates into the current config. Validates the
   * result before writing.
   */
  update(partial: Partial<AppConfig>): Promise<void>;
}

const ENV_OVERLAYS: Array<{
  envVar: string;
  field: keyof AppConfig;
}> = [
  { envVar: "OPENAI_API_KEY", field: "openAiAPIKey" },
  { envVar: "ANTHROPIC_API_KEY", field: "anthropicAPIKey" },
  { envVar: "OPENROUTER_API_KEY", field: "openRouterAPIKey" },
  { envVar: "BEDROCK_API_KEY", field: "bedrockAPIKey" },
  { envVar: "DAYTONA_API_KEY", field: "daytonaAPIKey" },
  { envVar: "DAYTONA_ORG_ID", field: "daytonaOrgId" },
  { envVar: "RUNLOOP_API_KEY", field: "runloopAPIKey" },
];

export function createConfigRepo(): ConfigRepository {
  function configPath(): string {
    return path.join(getBaseDir(), "config.json");
  }

  return {
    async get() {
      const fp = configPath();

      let raw: Record<string, unknown> = {};
      try {
        using _ = await Lock.read(fp);
        const text = await fs.readFile(fp, "utf-8");
        raw = JSON.parse(text);
      } catch {
        // File missing or unparseable — start from empty
      }

      // Apply env var overlays
      for (const { envVar, field } of ENV_OVERLAYS) {
        const envValue = process.env[envVar];
        if (envValue !== undefined) {
          raw[field] = envValue;
        }
      }

      // Parse with defaults
      return AppConfigSchema.parse(raw);
    },

    async update(partial) {
      const fp = configPath();

      using _ = await Lock.write(fp);

      // Read current on-disk config (without env overlays — we don't
      // want to persist env vars back to disk).
      let current: Record<string, unknown> = {};
      try {
        const text = await fs.readFile(fp, "utf-8");
        current = JSON.parse(text);
      } catch {
        // Start fresh
      }

      const merged = { ...current, ...partial };

      // Validate before writing
      AppConfigSchema.parse(merged);

      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(merged, null, 2), "utf-8");
    },
  };
}
