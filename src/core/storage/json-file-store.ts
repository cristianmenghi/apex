import path from "path";
import fs from "fs/promises";
import { z } from "zod";

import { Lock } from "../../util/lock";
import type { Store, RawStore } from "./store";
import { StoreNotFoundError, StoreValidationError } from "./store";

export interface JsonFileStoreConfig {
  /** Absolute base directory for this store's files. */
  baseDir: string;
  /** File extension (including the dot). Defaults to `".json"`. */
  ext?: string;
}

/**
 * Create a typed JSON file store backed by the filesystem.
 *
 * Every read validates with the provided Zod schema. Every write validates
 * before persisting. All operations use the Lock for concurrency safety.
 */
export function createJsonFileStore<T>(
  schema: z.ZodType<T>,
  config: JsonFileStoreConfig,
): Store<T> {
  const ext = config.ext ?? ".json";

  function filePath(key: string[]): string {
    return path.join(config.baseDir, ...key) + ext;
  }

  return {
    async get(key: string[]): Promise<T> {
      const fp = filePath(key);
      using _ = await Lock.read(fp);
      let text: string;
      try {
        text = await fs.readFile(fp, "utf-8");
      } catch (err) {
        if (isEnoent(err)) throw new StoreNotFoundError(key);
        throw err;
      }
      const parsed = JSON.parse(text);
      const result = schema.safeParse(parsed);
      if (!result.success) {
        throw new StoreValidationError(key, result.error.issues);
      }
      return result.data;
    },

    async put(key: string[], data: T): Promise<void> {
      const result = schema.safeParse(data);
      if (!result.success) {
        throw new StoreValidationError(key, result.error.issues);
      }
      const fp = filePath(key);
      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(result.data, null, 2), "utf-8");
    },

    async update(key: string[], fn: (draft: T) => void): Promise<T> {
      const fp = filePath(key);
      using _ = await Lock.write(fp);

      // Read
      let text: string;
      try {
        text = await fs.readFile(fp, "utf-8");
      } catch (err) {
        if (isEnoent(err)) throw new StoreNotFoundError(key);
        throw err;
      }
      const parsed = JSON.parse(text);
      const readResult = schema.safeParse(parsed);
      if (!readResult.success) {
        throw new StoreValidationError(key, readResult.error.issues);
      }

      // Mutate
      const draft = readResult.data;
      fn(draft);

      // Re-validate after mutation
      const writeResult = schema.safeParse(draft);
      if (!writeResult.success) {
        throw new StoreValidationError(key, writeResult.error.issues);
      }

      // Write back
      await fs.writeFile(
        fp,
        JSON.stringify(writeResult.data, null, 2),
        "utf-8",
      );
      return writeResult.data;
    },

    async delete(key: string[]): Promise<void> {
      const fp = filePath(key);
      using _ = await Lock.write(fp);
      try {
        await fs.unlink(fp);
      } catch (err) {
        if (isEnoent(err)) return; // swallow ENOENT
        throw err;
      }
    },

    async list(prefix: string[]): Promise<string[][]> {
      const dir = path.join(config.baseDir, ...prefix);
      using _ = await Lock.read(dir);
      let entries: string[];
      try {
        entries = await fs.readdir(dir);
      } catch (err) {
        if (isEnoent(err)) return [];
        throw err;
      }
      return entries
        .filter((entry) => entry.endsWith(ext))
        .map((entry) => [...prefix, entry.slice(0, -ext.length)]);
    },

    async exists(key: string[]): Promise<boolean> {
      const fp = filePath(key);
      using _ = await Lock.read(fp);
      try {
        await fs.access(fp);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/**
 * Create a raw (untyped) file store for non-JSON content.
 *
 * Keys include full filenames (no automatic extension is added).
 * All operations use the Lock for concurrency safety.
 */
export function createRawFileStore(config: { baseDir: string }): RawStore {
  function filePath(key: string[]): string {
    return path.join(config.baseDir, ...key);
  }

  return {
    async putRaw(key: string[], content: string): Promise<void> {
      const fp = filePath(key);
      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, content, "utf-8");
    },

    async appendRaw(key: string[], content: string): Promise<void> {
      const fp = filePath(key);
      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.appendFile(fp, content, "utf-8");
    },

    async getRaw(key: string[]): Promise<string> {
      const fp = filePath(key);
      using _ = await Lock.read(fp);
      try {
        return await fs.readFile(fp, "utf-8");
      } catch (err) {
        if (isEnoent(err)) throw new StoreNotFoundError(key);
        throw err;
      }
    },

    async putBinary(key: string[], content: Buffer): Promise<void> {
      const fp = filePath(key);
      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, content);
    },
  };
}

/** Type guard for ENOENT filesystem errors. */
function isEnoent(err: unknown): boolean {
  return (
    err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT"
  );
}
