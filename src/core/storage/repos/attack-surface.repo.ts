/**
 * Attack Surface Repository
 *
 * Encapsulates all I/O for the attack surface report generated at
 * the end of reconnaissance. The report is stored at
 * `{rootPath}/attack-surface-results.json`.
 *
 * Uses fs/promises + Lock directly because the file lives within a
 * session's rootPath (not under the standard key-based store).
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import {
  AttackSurfaceReportSchema,
  type AttackSurfaceReport,
} from "../schemas/asset";

export interface AttackSurfaceRepository {
  /** Save the attack surface report to `{rootPath}/attack-surface-results.json`. */
  save(rootPath: string, report: AttackSurfaceReport): Promise<string>;

  /**
   * Load the attack surface report from `{rootPath}/attack-surface-results.json`.
   * Returns null if the file doesn't exist.
   */
  load(rootPath: string): Promise<AttackSurfaceReport | null>;
}

function reportPath(rootPath: string): string {
  return path.join(rootPath, "attack-surface-results.json");
}

export function createAttackSurfaceRepo(): AttackSurfaceRepository {
  return {
    async save(rootPath, report) {
      const validated = AttackSurfaceReportSchema.parse(report);
      const fp = reportPath(rootPath);

      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(validated, null, 2), "utf-8");

      return fp;
    },

    async load(rootPath) {
      const fp = reportPath(rootPath);
      try {
        using _ = await Lock.read(fp);
        const text = await fs.readFile(fp, "utf-8");
        const parsed = JSON.parse(text);
        return AttackSurfaceReportSchema.parse(parsed);
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
  };
}
