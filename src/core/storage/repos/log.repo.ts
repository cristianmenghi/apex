/**
 * Log Repository
 *
 * Encapsulates all I/O for log file operations. Logs are appended
 * to files within a session's logs directory at
 * `{logsPath}/{fileName}`.
 *
 * Uses fs/promises + Lock directly because log files are raw text
 * content and live within a session's rootPath.
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";

export interface LogRepository {
  /** Append text content to a log file. Creates the file and parent dirs if missing. */
  append(logsPath: string, fileName: string, content: string): Promise<void>;

  /** Return the absolute path to a log file. */
  getPath(logsPath: string, fileName: string): string;
}

export function createLogRepo(): LogRepository {
  return {
    async append(logsPath, fileName, content) {
      const fp = path.join(logsPath, fileName);

      using _ = await Lock.write(fp);
      await fs.mkdir(logsPath, { recursive: true });
      await fs.appendFile(fp, content, "utf-8");
    },

    getPath(logsPath, fileName) {
      return path.join(logsPath, fileName);
    },
  };
}
