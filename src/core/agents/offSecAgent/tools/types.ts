import type { AIModel } from "../../../ai";
import type { AIAuthConfig } from "../../../ai/utils";
import type { SessionInfo } from "../../../session";
import type { AuthenticationAgentInput } from "../../specialized/authenticationAgent/agent";
import type { AttackSurfaceAgentInput } from "../../specialized/attackSurface/blackboxAgent";
import type { WhiteboxAttackSurfaceAgentInput } from "../../specialized/whiteboxAttackSurface/agent";
import type { AttackSurfaceResult } from "../../specialized/attackSurface/blackboxAgent";
import type { WhiteboxAttackSurfaceResult } from "../../specialized/whiteboxAttackSurface/types";

import type { ConsumeCallbacks, SubagentConsumeCallbacks } from "../types";

/** Return type of the `runAuthentication` factory function. */
export type RunAuthenticationResult = {
  success: boolean;
  summary: string;
  exportedCookies: string | undefined;
  exportedHeaders: Record<string, string> | undefined;
  strategy: string;
  authBarrier: { type: string; details: string; loginUrl?: string } | undefined;
  authDataPath: string;
};

/**
 * Factory functions that tools use to spawn sub-agents.
 *
 * Injected via `ToolContext.agentFactories` so tool files never need to
 * import agent modules directly — breaking the circular-dependency chain.
 */
export type AgentFactories = {
  /** Run the authentication sub-agent (wraps `runAuthenticationAgent`). */
  runAuthentication?: (
    input: AuthenticationAgentInput,
  ) => Promise<RunAuthenticationResult>;

  /** Instantiate and consume the blackbox attack-surface agent. */
  runBlackboxAttackSurface?: (
    input: AttackSurfaceAgentInput,
    consumeCallbacks?: ConsumeCallbacks,
  ) => Promise<AttackSurfaceResult>;

  /** Instantiate and consume the whitebox attack-surface agent. */
  runWhiteboxAttackSurface?: (
    input: WhiteboxAttackSurfaceAgentInput,
    consumeCallbacks?: ConsumeCallbacks,
  ) => Promise<WhiteboxAttackSurfaceResult>;
};

/**
 * Shared context passed to every tool factory.
 *
 * Each tool receives what it needs from here — session paths,
 * abort signal, etc. — so individual tool files never import
 * session or agent internals directly.
 */
export type ToolContext = {
  /** Session providing paths for findings, POCs, logs, scratchpad, etc. */
  session: SessionInfo;

  /** The target URL / host — needed by browser tools for context */
  target?: string;

  /** Signal to cancel in-flight operations */
  abortSignal?: AbortSignal;

  /** AI model — needed by tools that delegate to sub-agents */
  model?: AIModel;

  /** Per-provider API key overrides — needed by tools that spawn sub-agents */
  authConfig?: AIAuthConfig;

  /** Callbacks for forwarding subagent stream events to the parent consumer */
  subagentCallbacks?: SubagentConsumeCallbacks;
  callbacks?: ConsumeCallbacks;

  /**
   * Factory functions for spawning sub-agents.
   *
   * Populated by the top-level agent harness so tool files never need to
   * import agent modules directly (avoids circular dependencies).
   */
  agentFactories?: AgentFactories;
};
