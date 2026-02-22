/**
 * Unified Storage Schemas
 *
 * Single source of truth for all on-disk data shapes in the Apex project.
 * Every persisted entity has exactly one canonical Zod schema defined here
 * (or re-exported from the module that owns it). TypeScript types are
 * always derived via `z.infer<>`.
 *
 * Usage:
 *   import { SessionInfoSchema, type SessionInfo } from "@/core/storage/schemas";
 */

// Session schemas
export {
  AuthCredentialsSchema,
  type AuthCredentials,
  ScopeConstraintsSchema,
  type ScopeConstraints,
  OffensiveHeadersConfigSchema,
  type OffensiveHeadersConfig,
  OperatorSettingsSchema,
  type OperatorSettings,
  SessionConfigSchema,
  type SessionConfig,
  SessionInfoSchema,
  type SessionInfo,
  SessionRefSchema,
  type SessionRef,
} from "./session";

// Finding schemas
export {
  SeverityEnum,
  type Severity,
  FindingSchema,
  type Finding,
} from "./finding";

// App config schemas
export { AppConfigSchema, type AppConfig } from "./config";

// Operator schemas
export {
  PermissionTierSchema,
  type PermissionTier,
  OperatorModeSchema,
  type OperatorMode,
  OperatorStageSchema,
  type OperatorStage,
  PendingApprovalSchema,
  type PendingApproval,
  ApprovalDecisionSchema,
  type ApprovalDecision,
  ActionHistoryEntrySchema,
  type ActionHistoryEntry,
  StageProgressSchema,
  type StageProgress,
  DiscoveredEndpointSchema,
  type DiscoveredEndpoint,
  DiscoveredCredentialSchema,
  type DiscoveredCredential,
  VerifiedFindingSchema,
  type VerifiedFinding,
  SidebarTargetStateSchema,
  type SidebarTargetState,
  SidebarHypothesisSchema,
  type SidebarHypothesis,
  SidebarEvidenceSchema,
  type SidebarEvidence,
  OperatorSessionStateSchema,
  type OperatorSessionState,
} from "./operator";

// Asset schemas
export {
  AssetDetailsSchema,
  AssetTypeEnum,
  RiskLevelEnum,
  DocumentAssetSchema,
  DocumentedAssetRecordSchema,
  AttackSurfaceSummarySchema,
  AttackSurfaceReportSchema,
  PentestTargetSchema,
  type AssetDetails,
  type AssetType,
  type RiskLevel,
  type DocumentAssetInput,
  type DocumentedAssetRecord,
  type AttackSurfaceSummary,
  type AttackSurfaceReport,
  type PentestTarget,
} from "./asset";

// POC schemas
export { PocSchema, type Poc } from "./poc";

// Auth schemas
export { AuthDataSchema, type AuthData } from "./auth";

// Message schemas (re-exported from messages module)
export { ModelMessageObject, type Message, type ToolMessage } from "./message";
