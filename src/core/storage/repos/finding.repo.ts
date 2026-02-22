/**
 * Finding Repository
 *
 * Encapsulates all I/O for security finding entities. Findings are
 * written to `{session.findingsPath}/{date}-{sanitized_title}.json`
 * with a companion `.md` file and an append to `findings-summary.md`
 * in the session root.
 *
 * Uses RawStore for the markdown and summary files, and JsonFileStore
 * for the structured JSON findings.
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import { FindingSchema, type Finding } from "../schemas/finding";

export interface FindingRepository {
  /**
   * Save a finding: writes both the JSON and markdown files, and
   * appends a line to findings-summary.md.
   *
   * @param sessionId   - Session that produced the finding
   * @param findingsPath - Absolute path to the session's findings dir
   * @param rootPath     - Absolute path to the session's root dir
   * @param target       - Target URL/host being tested
   * @param finding      - The finding data (must pass FindingSchema)
   */
  save(
    sessionId: string,
    findingsPath: string,
    rootPath: string,
    target: string,
    finding: Finding,
  ): Promise<{ jsonPath: string; mdPath: string; findingId: string }>;

  /**
   * List all JSON findings in a findings directory.
   * Skips files that fail validation.
   */
  list(findingsPath: string): Promise<Finding[]>;
}

export function createFindingRepo(): FindingRepository {
  return {
    async save(sessionId, findingsPath, rootPath, target, finding) {
      // Validate input
      const validated = FindingSchema.parse(finding);

      const timestamp = new Date().toISOString();
      const findingWithMeta: Finding = {
        ...validated,
        timestamp,
        sessionId,
        target,
      };

      // Safe filename from title
      const safeTitle = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50);

      const findingId = `${timestamp.split("T")[0]}-${safeTitle}`;
      const jsonFilename = `${findingId}.json`;
      const jsonPath = path.join(findingsPath, jsonFilename);
      const mdFilename = `${findingId}.md`;
      const mdPath = path.join(findingsPath, mdFilename);

      // Write structured JSON
      {
        using _ = await Lock.write(jsonPath);
        await fs.mkdir(path.dirname(jsonPath), { recursive: true });
        await fs.writeFile(
          jsonPath,
          JSON.stringify(findingWithMeta, null, 2),
          "utf-8",
        );
      }

      // Write human-readable markdown
      const markdown = `# ${validated.title}

**Severity:** ${validated.severity}
**Target:** ${target}
**Endpoint:** ${validated.endpoint}
**Date:** ${timestamp}
**Session:** ${sessionId}

## Description

${validated.description}

## Impact

${validated.impact}

## Evidence

\`\`\`
${validated.evidence}
\`\`\`

## POC

Path: \`${validated.pocPath}\`

## Remediation

${validated.remediation}

${validated.references ? `## References\n\n${validated.references}` : ""}

---

*This finding was automatically documented by the Pensar penetration testing agent.*
`;

      {
        using _ = await Lock.write(mdPath);
        await fs.writeFile(mdPath, markdown, "utf-8");
      }

      // Append to findings-summary.md
      const summaryPath = path.join(rootPath, "findings-summary.md");
      const summaryEntry = `- [${validated.severity}] ${validated.title} - \`findings/${mdFilename}\`\n`;

      {
        using _ = await Lock.write(summaryPath);
        try {
          await fs.appendFile(summaryPath, summaryEntry, "utf-8");
        } catch {
          const header = `# Findings Summary\n\n**Target:** ${target}  \n**Session:** ${sessionId}\n\n## All Findings\n\n`;
          await fs.writeFile(summaryPath, header + summaryEntry, "utf-8");
        }
      }

      return { jsonPath, mdPath, findingId };
    },

    async list(findingsPath) {
      let entries: string[];
      try {
        entries = await fs.readdir(findingsPath);
      } catch {
        return [];
      }

      const findings: Finding[] = [];
      for (const entry of entries) {
        if (!entry.endsWith(".json")) continue;
        const fp = path.join(findingsPath, entry);
        try {
          using _ = await Lock.read(fp);
          const text = await fs.readFile(fp, "utf-8");
          const parsed = JSON.parse(text);
          const result = FindingSchema.safeParse(parsed);
          if (result.success) {
            findings.push(result.data);
          }
        } catch {
          // Skip corrupt/unreadable files
        }
      }
      return findings;
    },
  };
}
