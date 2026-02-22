/**
 * Canonical Zod schemas for operator session state and sub-entities.
 *
 * Source of truth: src/core/operator/types.ts (interfaces) and
 * src/core/session/index.ts (OperatorSessionState for resume).
 *
 * This replaces the loosely-typed `unknown[]` arrays in the session
 * module's OperatorSessionState with fully typed Zod schemas.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Permission Tier
// ---------------------------------------------------------------------------

export const PermissionTierSchema = z
  .number()
  .int()
  .min(1)
  .max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>;

export type PermissionTier = z.infer<typeof PermissionTierSchema>;

// ---------------------------------------------------------------------------
// Operator Mode & Stage
// ---------------------------------------------------------------------------

export const OperatorModeSchema = z.enum(["plan", "manual", "auto"]);
export type OperatorMode = z.infer<typeof OperatorModeSchema>;

export const OperatorStageSchema = z.enum([
  "setup",
  "recon",
  "enumerate",
  "test",
  "validate",
  "report",
]);
export type OperatorStage = z.infer<typeof OperatorStageSchema>;

// ---------------------------------------------------------------------------
// Pending Approval
// ---------------------------------------------------------------------------

export const PendingApprovalSchema = z.object({
  id: z.string(),
  toolName: z.string(),
  toolCallId: z.string(),
  args: z.record(z.string(), z.unknown()),
  tier: PermissionTierSchema,
  reasoning: z.string().optional(),
  timestamp: z.number(),
});

export type PendingApproval = z.infer<typeof PendingApprovalSchema>;

// ---------------------------------------------------------------------------
// Approval Decision
// ---------------------------------------------------------------------------

export const ApprovalDecisionSchema = z.enum([
  "approved",
  "denied",
  "auto-approved",
]);
export type ApprovalDecision = z.infer<typeof ApprovalDecisionSchema>;

// ---------------------------------------------------------------------------
// Action History Entry
// ---------------------------------------------------------------------------

export const ActionHistoryEntrySchema = z.object({
  id: z.string(),
  toolName: z.string(),
  toolCallId: z.string(),
  tier: PermissionTierSchema,
  decision: ApprovalDecisionSchema,
  timestamp: z.number(),
  duration: z.number().optional(),
  resultSummary: z.string().optional(),
});

export type ActionHistoryEntry = z.infer<typeof ActionHistoryEntrySchema>;

// ---------------------------------------------------------------------------
// Stage Progress
// ---------------------------------------------------------------------------

export const StageProgressSchema = z.object({
  started: z.boolean(),
  startedAt: z.number().optional(),
  completed: z.boolean(),
  completedAt: z.number().optional(),
});

export type StageProgress = z.infer<typeof StageProgressSchema>;

// ---------------------------------------------------------------------------
// Discovered Endpoint
// ---------------------------------------------------------------------------

export const DiscoveredEndpointSchema = z.object({
  id: z.string(),
  path: z.string(),
  method: z.string(),
  category: z.string().optional(),
  params: z.array(z.string()).optional(),
  status: z
    .enum(["untested", "suspicious", "confirmed", "clean", "blocked"])
    .optional(),
  vulnType: z.string().optional(),
});

export type DiscoveredEndpoint = z.infer<typeof DiscoveredEndpointSchema>;

// ---------------------------------------------------------------------------
// Discovered Credential
// ---------------------------------------------------------------------------

export const DiscoveredCredentialSchema = z.object({
  id: z.string(),
  username: z.string(),
  secret: z.string(),
  type: z.enum(["password", "cookie", "jwt", "ssh_key", "api_key"]),
  source: z.string(),
  scope: z.string(),
  isActive: z.boolean().optional(),
});

export type DiscoveredCredential = z.infer<typeof DiscoveredCredentialSchema>;

// ---------------------------------------------------------------------------
// Verified Finding
// ---------------------------------------------------------------------------

export const VerifiedFindingSchema = z.object({
  id: z.string(),
  type: z.string(),
  endpoint: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  summary: z.string(),
  pocPath: z.string().optional(),
});

export type VerifiedFinding = z.infer<typeof VerifiedFindingSchema>;

// ---------------------------------------------------------------------------
// Sidebar Target State
// ---------------------------------------------------------------------------

export const SidebarTargetStateSchema = z.object({
  host: z.string().optional(),
  ports: z.array(z.number()).optional(),
  authState: z.string().optional(),
  phase: z.string().optional(),
  objective: z.string().optional(),
});

export type SidebarTargetState = z.infer<typeof SidebarTargetStateSchema>;

// ---------------------------------------------------------------------------
// Sidebar Hypothesis
// ---------------------------------------------------------------------------

export const SidebarHypothesisSchema = z.object({
  id: z.string(),
  description: z.string(),
  confidence: z.number(),
  timestamp: z.number(),
});

export type SidebarHypothesis = z.infer<typeof SidebarHypothesisSchema>;

// ---------------------------------------------------------------------------
// Sidebar Evidence
// ---------------------------------------------------------------------------

export const SidebarEvidenceSchema = z.object({
  id: z.string(),
  type: z.string(),
  path: z.string(),
  description: z.string(),
  timestamp: z.number(),
});

export type SidebarEvidence = z.infer<typeof SidebarEvidenceSchema>;

// ---------------------------------------------------------------------------
// Operator Session State (persisted to operator-state.json)
// ---------------------------------------------------------------------------

/**
 * Fully typed operator session state for resumption.
 *
 * This replaces the loosely-typed version in session/index.ts that
 * used `unknown[]` for arrays. The structure matches the JSON written
 * by `saveOperatorState()` and read by `loadOperatorState()`.
 */
export const OperatorSessionStateSchema = z.object({
  /** Operator mode: plan, manual, auto */
  mode: OperatorModeSchema,
  /** Current workflow stage */
  currentStage: OperatorStageSchema,
  /** Auto-approve tier level */
  autoApproveTier: PermissionTierSchema,
  /** Pending approval requests */
  pendingApprovals: z.array(PendingApprovalSchema).default([]),
  /** Action approval/denial history */
  actionHistory: z.array(ActionHistoryEntrySchema).default([]),
  /** Per-stage progress tracking */
  stageProgress: z.record(OperatorStageSchema, StageProgressSchema).default({}),
  /** Chat messages history (kept as unknown for flexibility) */
  messages: z.array(z.unknown()).default([]),
  /** Discovered attack surface endpoints */
  attackSurface: z.array(DiscoveredEndpointSchema).default([]),
  /** Found credentials */
  credentials: z.array(DiscoveredCredentialSchema).default([]),
  /** Verified vulnerabilities */
  verifiedVulns: z.array(VerifiedFindingSchema).default([]),
  /** Target state (host, phase, objective) */
  targetState: SidebarTargetStateSchema.default({}),
  /** Tracked hypotheses */
  hypotheses: z.array(SidebarHypothesisSchema).default([]),
  /** Collected evidence */
  evidence: z.array(SidebarEvidenceSchema).default([]),
  /** When the session was paused (ISO string) */
  pausedAt: z.string().optional(),
  /** Last run ID for log correlation */
  lastRunId: z.string().optional(),
});

export type OperatorSessionState = z.infer<typeof OperatorSessionStateSchema>;
