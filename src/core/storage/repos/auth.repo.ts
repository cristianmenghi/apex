/**
 * Auth Repository
 *
 * Encapsulates all I/O for authentication data. Two distinct files
 * are managed:
 *
 * 1. `{rootPath}/auth/auth-data.json` - credentials captured after
 *    a successful authentication flow (cookies, headers, strategy).
 *
 * 2. `{rootPath}/session-info.json` - session info snapshot used by
 *    sub-agents that only need paths and auth context.
 *
 * Uses fs/promises + Lock directly because files live within a
 * session's rootPath (not under the standard key-based store).
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import { AuthDataSchema, type AuthData } from "../schemas/auth";
import { SessionInfoSchema, type SessionInfo } from "../schemas/session";

export interface AuthRepository {
  /** Save auth data to `{rootPath}/auth/auth-data.json`. */
  saveAuthData(rootPath: string, authData: AuthData): Promise<string>;

  /**
   * Load auth data from `{rootPath}/auth/auth-data.json`.
   * Returns null if the file doesn't exist.
   */
  loadAuthData(rootPath: string): Promise<AuthData | null>;

  /** Save session info snapshot to `{rootPath}/session-info.json`. */
  saveSessionInfo(rootPath: string, sessionInfo: SessionInfo): Promise<string>;
}

export function createAuthRepo(): AuthRepository {
  return {
    async saveAuthData(rootPath, authData) {
      const validated = AuthDataSchema.parse(authData);
      const authDir = path.join(rootPath, "auth");
      const fp = path.join(authDir, "auth-data.json");

      using _ = await Lock.write(fp);
      await fs.mkdir(authDir, { recursive: true });
      await fs.writeFile(fp, JSON.stringify(validated, null, 2), "utf-8");

      return fp;
    },

    async loadAuthData(rootPath) {
      const fp = path.join(rootPath, "auth", "auth-data.json");
      try {
        using _ = await Lock.read(fp);
        const text = await fs.readFile(fp, "utf-8");
        const parsed = JSON.parse(text);
        return AuthDataSchema.parse(parsed);
      } catch (err) {
        if (
          err instanceof Error &&
          (err as NodeJS.ErrnoException).code === "ENOENT"
        ) {
          return null;
        }
        throw err;
      }
    },

    async saveSessionInfo(rootPath, sessionInfo) {
      const validated = SessionInfoSchema.parse(sessionInfo);
      const fp = path.join(rootPath, "session-info.json");

      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(validated, null, 2), "utf-8");

      return fp;
    },
  };
}
