import os from "os";
import path from "path";

const DEFAULT_BASE_DIR = path.join(os.homedir(), ".pensar");

let overrideBaseDir: string | undefined;

/**
 * Get the base directory for all storage operations.
 * Defaults to `~/.pensar`. Override with `setBaseDir()` for testing.
 */
export function getBaseDir(): string {
  return overrideBaseDir ?? DEFAULT_BASE_DIR;
}

/**
 * Override the base directory. Useful for tests to isolate storage
 * in a temporary directory.
 */
export function setBaseDir(dir: string): void {
  overrideBaseDir = dir;
}

/**
 * Reset the base directory back to the default (`~/.pensar`).
 */
export function resetBaseDir(): void {
  overrideBaseDir = undefined;
}
