/**
 * Canonical Zod schemas for security finding persisted entities.
 *
 * Consolidates:
 * - ApexFindingObject from offSecAgent/types.ts
 * - DocumentFindingSchema from session/types.ts
 *
 * The severity preprocessor normalizes free-text severity strings
 * (e.g., "Critical (9.8)") into the canonical enum values.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Severity Enum with preprocessor
// ---------------------------------------------------------------------------

export const SeverityEnum = z.preprocess((val) => {
  if (typeof val === "string") {
    const upper = val.toUpperCase();
    if (upper.includes("CRITICAL")) return "CRITICAL";
    if (upper.includes("HIGH")) return "HIGH";
    if (upper.includes("MEDIUM")) return "MEDIUM";
    if (upper.includes("LOW")) return "LOW";
  }
  return val;
}, z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]));

export type Severity = z.infer<typeof SeverityEnum>;

// ---------------------------------------------------------------------------
// Finding Schema (canonical on-disk shape)
// ---------------------------------------------------------------------------

/**
 * The canonical finding schema matching the on-disk JSON written by
 * document_finding and parsed back by the report generator.
 *
 * Fields added after initial release use `.default()` for forward
 * compatibility with older finding files.
 */
export const FindingSchema = z.object({
  /** Finding title */
  title: z.string(),
  /** Severity level (preprocessed from free-text) */
  severity: SeverityEnum,
  /** Detailed technical description */
  description: z.string(),
  /** Potential impact if exploited */
  impact: z.string(),
  /** Evidence/proof of vulnerability including POC output */
  evidence: z.string(),
  /** Full URL endpoint */
  endpoint: z.string(),
  /** Relative path to POC script */
  pocPath: z.string(),
  /** Steps to fix the vulnerability */
  remediation: z.string(),
  /** CVE, CWE, or related references */
  references: z.string().optional(),
  /** Human-readable description of the tool call that generated this finding */
  toolCallDescription: z.string().optional(),
  /** Unique finding identifier (added by persistence layer) */
  id: z.string().optional(),
  /** ISO timestamp when finding was created */
  timestamp: z.string().optional(),
  /** Session ID that produced this finding */
  sessionId: z.string().optional(),
  /** Target URL/host being tested */
  target: z.string().optional(),
});

export type Finding = z.infer<typeof FindingSchema>;
