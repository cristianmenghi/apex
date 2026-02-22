/**
 * Message Repository
 *
 * Encapsulates all I/O for message persistence. Messages are dumped
 * as flat JSON arrays into session-scoped paths:
 *
 * - `{rootPath}/messages.json`               - main agent messages
 * - `{rootPath}/subagents/{id}/messages.json` - sub-agent messages
 *
 * Uses fs/promises + Lock directly because message dumps live within
 * a session's rootPath (not under the standard key-based store).
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import type { Message } from "../schemas/message";

export interface MessageRepository {
  /** Save messages to `{rootPath}/messages.json`. */
  saveMessages(rootPath: string, messages: Message[]): Promise<void>;

  /** Save sub-agent messages to `{rootPath}/subagents/{subagentId}/messages.json`. */
  saveSubagentMessages(
    rootPath: string,
    subagentId: string,
    messages: Message[],
  ): Promise<void>;
}

export function createMessageRepo(): MessageRepository {
  return {
    async saveMessages(rootPath, messages) {
      const fp = path.join(rootPath, "messages.json");

      using _ = await Lock.write(fp);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, JSON.stringify(messages, null, 2), "utf-8");
    },

    async saveSubagentMessages(rootPath, subagentId, messages) {
      const subagentDir = path.join(rootPath, "subagents", subagentId);
      const fp = path.join(subagentDir, "messages.json");

      using _ = await Lock.write(fp);
      await fs.mkdir(subagentDir, { recursive: true });
      await fs.writeFile(fp, JSON.stringify(messages, null, 2), "utf-8");
    },
  };
}
