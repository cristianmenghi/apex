/**
 * Session Repository
 *
 * Encapsulates all I/O for session entities. Sessions are stored at
 * `~/.pensar/session/{id}.json` and are the primary metadata record
 * for each penetration testing run.
 *
 * Runtime-only fields (_rateLimiter, tokensIn, tokensOut) are stripped
 * before persistence and are NOT part of the on-disk schema.
 */

import type { z } from "zod";

import { StoreNotFoundError } from "../store";
import { createJsonFileStore } from "../json-file-store";
import { getBaseDir } from "../base";
import { SessionInfoSchema, type SessionInfo } from "../schemas/session";

export interface SessionRepository {
  /** Read a session by ID. Throws StoreNotFoundError if missing. */
  get(id: string): Promise<SessionInfo>;

  /**
   * Create (persist) a session. Strips runtime-only fields
   * (_rateLimiter, tokensIn, tokensOut) before writing.
   */
  create(session: SessionInfo & Record<string, unknown>): Promise<void>;

  /**
   * Read-modify-write a session. The mutation function receives the
   * current on-disk session; `time.updated` is set automatically
   * after the mutation runs.
   */
  update(id: string, fn: (draft: SessionInfo) => void): Promise<SessionInfo>;

  /** Delete a session by ID. No-op if it doesn't exist. */
  remove(id: string): Promise<void>;

  /**
   * List all sessions. Sessions that fail schema validation are
   * silently skipped (stale / corrupt files).
   */
  list(): Promise<SessionInfo[]>;
}

/** Runtime fields that must not be persisted. */
const RUNTIME_FIELDS = ["_rateLimiter", "tokensIn", "tokensOut"] as const;

export function createSessionRepo(): SessionRepository {
  let store: ReturnType<typeof createStore> | undefined;

  function createStore() {
    // Cast needed because OperatorSettingsSchema uses .default() which
    // makes z.infer (input) differ from z.output. safeParse always
    // returns the output type, so the cast is safe at runtime.
    return createJsonFileStore(
      SessionInfoSchema as unknown as z.ZodType<SessionInfo>,
      {
        baseDir: getBaseDir(),
        ext: ".json",
      },
    );
  }

  function getStore() {
    return (store ??= createStore());
  }

  return {
    async get(id) {
      return getStore().get(["session", id]);
    },

    async create(session) {
      // Strip runtime-only fields before persisting
      const cleaned = { ...session };
      for (const field of RUNTIME_FIELDS) {
        delete (cleaned as Record<string, unknown>)[field];
      }
      await getStore().put(["session", session.id], cleaned as SessionInfo);
    },

    async update(id, fn) {
      return getStore().update(["session", id], (draft) => {
        fn(draft);
        draft.time.updated = Date.now();
      });
    },

    async remove(id) {
      await getStore().delete(["session", id]);
    },

    async list() {
      const keys = await getStore().list(["session"]);
      const sessions: SessionInfo[] = [];
      for (const key of keys) {
        try {
          sessions.push(await getStore().get(key));
        } catch (err) {
          if (err instanceof StoreNotFoundError) continue;
          // Skip validation errors — stale/corrupt files
          if (
            err instanceof Error &&
            err.name === "StoreValidationError"
          ) {
            continue;
          }
          throw err;
        }
      }
      return sessions;
    },
  };
}
