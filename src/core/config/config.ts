import { repos } from "../storage/repos";
import { Installation } from "../installation";
import type { AppConfig } from "../storage/schemas/config";

export type Config = AppConfig;

export async function init(): Promise<Config> {
  // repos.config.get() returns defaults if the file is missing.
  // Write those defaults to disk so the config file is created.
  const config = await repos.config.get();
  await repos.config.update(config);

  const version = await Installation.getVersion();
  return { ...config, version };
}

export async function get(): Promise<Config> {
  const config = await repos.config.get();
  const version = await Installation.getVersion();
  return { ...config, version };
}

export async function update(config: Partial<Config>) {
  // Strip `version` — it's a runtime-only field, not persisted.
  const { version: _, ...rest } = config;
  await repos.config.update(rest);
}
