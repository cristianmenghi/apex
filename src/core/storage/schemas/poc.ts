/**
 * Canonical Zod schema for proof-of-concept scripts.
 *
 * Captures the on-disk shape of POC metadata. The actual POC content
 * is a script file; this schema describes the structured metadata
 * associated with a POC (from createPoc tool input + execution result).
 *
 * Source of truth: src/core/agents/offSecAgent/tools/createPoc.ts
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// POC Schema
// ---------------------------------------------------------------------------

export const PocSchema = z.object({
  /** Short descriptive name for the POC */
  pocName: z.string(),
  /** Script language */
  pocType: z.enum(["bash", "python", "javascript"]),
  /** The full POC script content */
  pocContent: z.string(),
  /** What this POC demonstrates */
  description: z.string(),
  /** Relative path to the saved POC file (set after successful execution) */
  pocPath: z.string().optional(),
  /** ISO timestamp when POC was created */
  createdAt: z.string().optional(),
  /** Session ID that produced this POC */
  sessionId: z.string().optional(),
});

export type Poc = z.infer<typeof PocSchema>;
