import { tool } from "ai";
import { z } from "zod";
import type { ToolContext } from "./types";
import { repos } from "../../../storage/repos";

export const documentFindingInputSchema = z.object({
  title: z.string().describe("Finding title"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  description: z.string().describe("Detailed description of the finding"),
  impact: z.string().describe("Potential impact if exploited"),
  evidence: z.string().describe("Evidence/proof of the vulnerability"),
  endpoint: z.string().describe("The affected endpoint or URL"),
  pocPath: z
    .string()
    .describe("Relative path to the POC script (e.g., pocs/poc_sqli.sh)"),
  remediation: z.string().describe("Steps to fix the issue"),
  references: z.string().optional().describe("CVE, CWE, or related references"),
  toolCallDescription: z
    .string()
    .describe(
      "A concise, human-readable description of what this tool call is doing (e.g., 'Documenting SQL injection finding')",
    ),
});

export type DocumentFindingInput = z.infer<typeof documentFindingInputSchema>;

export function documentFinding(ctx: ToolContext) {
  const { session } = ctx;

  return tool({
    description: `Document a confirmed security finding with severity, impact, and remediation guidance.

SEVERITY LEVELS:
- CRITICAL: Immediate risk of system compromise (RCE, auth bypass, SQL injection with data access)
- HIGH: Significant security risk (XSS, CSRF, sensitive data exposure, privilege escalation)
- MEDIUM: Security weakness that could be exploited (information disclosure, weak configs)
- LOW: Minor security concern (missing headers, verbose errors)

FINDING STRUCTURE:
- Title: Clear, concise description
- Severity: Use CVSS if applicable
- Description: Detailed technical explanation
- Impact: Business and technical consequences
- Evidence: Commands run, responses received, proof of vulnerability
- Remediation: Specific, actionable steps to fix
- References: CVE, CWE, OWASP, or security advisories`,
    inputSchema: documentFindingInputSchema,
    execute: async (finding) => {
      try {
        const { mdPath, findingId } = await repos.findings.save(
          session.id,
          session.findingsPath,
          session.rootPath,
          session.targets[0],
          finding,
        );

        return {
          success: true,
          finding: {
            ...finding,
            timestamp: new Date().toISOString(),
            sessionId: session.id,
            target: session.targets[0],
          },
          filepath: mdPath,
          message: `Finding documented: [${finding.severity}] ${finding.title}`,
        };
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return {
          success: false,
          error: errorMsg,
          message: `Failed to document finding: ${errorMsg}`,
        };
      }
    },
  });
}
