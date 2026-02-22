/**
 * Canonical Zod schemas for persisted messages.
 *
 * Re-exports from the existing messages module which already defines
 * the canonical Zod schemas. No duplication needed.
 *
 * Source of truth: src/core/messages/types.ts
 */

export {
  ModelMessageObject,
  type Message,
  type ToolMessage,
} from "../../messages/types";
