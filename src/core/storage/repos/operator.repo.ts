/**
 * Operator State Repository
 *
 * Encapsulates all I/O for operator session state used by the
 * dashboard for pause/resume. The state file lives WITHIN a session's
 * rootPath at `{rootPath}/operator-state.json`.
 *
 * Uses fs/promises + Lock directly because the file location is
 * session-scoped (not under the standard `~/.pensar` key-based store).
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import {
  OperatorSessionStateSchema,
  type OperatorSessionState,
} from "../schemas/operator";

export interface OperatorStateRepository {
  /** Save operator state to `{rootPath}/operator-state.json`. */
  save(rootPath: string, state: OperatorSessionState): Promise<void>;

  /**
   * Load operator state from `{rootPath}/operator-state.json`.
   * Returns null if the file doesn't exist.
   */
  load(rootPath: string): Promise<OperatorSessionState | null>;

  /** Check whether an operator state file exists. */
  exists(rootPath: string): Promise<boolean>;
}

function statePath(rootPath: string): string {
  return path.join(rootPath, "operator-state.json");
}

export function createOperatorStateRepo(): OperatorStateRepository {
  return {
    async save(rootPath, state) {
      const fp = statePath(rootPath);
      const validated = OperatorSessionStateSchema.parse(state);
      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(validated, null, 2), "utf-8");
    },

    async load(rootPath) {
      const fp = statePath(rootPath);
      try {
        using _ = await Lock.read(fp);
        const text = await fs.readFile(fp, "utf-8");
        const parsed = JSON.parse(text);
        return OperatorSessionStateSchema.parse(parsed);
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

    async exists(rootPath) {
      const fp = statePath(rootPath);
      try {
        using _ = await Lock.read(fp);
        await fs.access(fp);
        return true;
      } catch {
        return false;
      }
    },
  };
}
