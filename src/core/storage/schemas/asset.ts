/**
 * Canonical Zod schemas for documented assets and attack surface reports.
 *
 * Re-exports existing schemas from the attack surface agent module,
 * which already define the canonical shapes. No duplication needed.
 *
 * Source of truth: src/core/agents/specialized/attackSurface/schemas.ts
 */

export {
  // Asset schemas
  AssetDetailsSchema,
  AssetTypeEnum,
  RiskLevelEnum,
  DocumentAssetSchema,
  DocumentedAssetRecordSchema,
  // Attack surface report schemas
  PentestTargetSchema,
  AttackSurfaceSummarySchema,
  AttackSurfaceReportSchema,
  // Types
  type AssetDetails,
  type AssetType,
  type RiskLevel,
  type DocumentAssetInput,
  type DocumentedAssetRecord,
  type PentestTarget,
  type AttackSurfaceSummary,
  type AttackSurfaceReport,
} from "../../agents/specialized/attackSurface/schemas";
