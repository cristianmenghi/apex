/**
 * POC Repository
 *
 * Encapsulates all I/O for proof-of-concept script files. POCs are
 * written to `{pocsPath}/poc_{sanitizedName}{ext}` with a proper
 * shebang line and are set as executable.
 *
 * Uses fs/promises + Lock directly because POC files are raw script
 * content (not JSON) and live within a session's rootPath.
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import { PocSchema, type Poc } from "../schemas/poc";

export interface PocRepository {
  /**
   * Create a POC script file. Validates the POC metadata, prepends
   * a shebang if missing, writes the file, and sets it executable.
   *
   * Returns the absolute path to the created file.
   */
  create(pocsPath: string, poc: Poc): Promise<string>;
}

const SHEBANGS: Record<string, string> = {
  bash: "#!/bin/bash\nset -e\n\n",
  python: "#!/usr/bin/env python3\n\n",
  javascript: "#!/usr/bin/env node\n\n",
};

function sanitizeFilename(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 50);
}

export function createPocRepo(): PocRepository {
  return {
    async create(pocsPath, poc) {
      const validated = PocSchema.parse(poc);

      const extension =
        validated.pocType === "bash"
          ? ".sh"
          : validated.pocType === "python"
            ? ".py"
            : ".js";
      const sanitizedName = sanitizeFilename(validated.pocName);
      const filename = `poc_${sanitizedName}${extension}`;
      const fp = path.join(pocsPath, filename);

      let content = validated.pocContent.trim();

      // Add shebang if missing
      if (!content.startsWith("#!")) {
        content = SHEBANGS[validated.pocType] + content;
      }

      using _ = await Lock.write(fp);
      await fs.mkdir(pocsPath, { recursive: true });
      await fs.writeFile(fp, content, "utf-8");
      await fs.chmod(fp, 0o755);

      return fp;
    },
  };
}
