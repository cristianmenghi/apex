import type { AutocompleteOption } from "../shared/prompt-input";
import type { OperatorSessionState } from "../../../core/operator";
import { BASE_SYSTEM_PROMPT } from "../../../core/agents/offSecAgent/prompt";
import type { ConsumeCallbacks } from "../../../core/agents/offSecAgent/types";
import type { AIModel } from "../../../core/ai/ai";
import type { AIAuthConfig } from "../../../core/ai/utils";
import type { SessionInfo } from "../../../core/session";
import type {
  SchemaBackedCommand,
  CommandOutput,
} from "../../../core/commands/types";
import { CodeAgent } from "../../../core/agents/specialized/codeAgent/agent";
import { threatModelCommand } from "../../../core/commands/threatModel";

// ---------------------------------------------------------------------------
// Autocomplete option filtering for operator mode
// ---------------------------------------------------------------------------

export function filterOperatorAutocomplete(
  allOptions: AutocompleteOption[],
  skillSlugs: Set<string>,
): AutocompleteOption[] {
  const allowedCommands = new Set(["/create-skill", "/models", "/threat-model", "/tm"]);
  return allOptions.filter(
    (opt) => allowedCommands.has(opt.value) || skillSlugs.has(opt.value),
  );
}

// ---------------------------------------------------------------------------
// Submit gating
// ---------------------------------------------------------------------------

export type DashboardStatus = "idle" | "running" | "waiting" | "done";

export interface SubmitResult {
  action: "run" | "blocked" | "empty";
  prompt?: string;
  denyPending: boolean;
}

export function resolveSubmit(
  value: string,
  status: DashboardStatus,
  hasPendingApprovals: boolean,
): SubmitResult {
  const trimmed = value.trim();
  if (!trimmed) return { action: "empty", denyPending: false };
  if (status === "running")
    return { action: "blocked", denyPending: hasPendingApprovals };
  return { action: "run", prompt: trimmed, denyPending: hasPendingApprovals };
}

// ---------------------------------------------------------------------------
// Command routing
// ---------------------------------------------------------------------------

export type CommandAction =
  | { type: "show-models" }
  | { type: "run-skill"; content: string; autopilot: boolean }
  | { type: "run-schema-command"; command: SchemaBackedCommand<unknown>; args: string }
  | { type: "execute-command"; command: string };

// ---------------------------------------------------------------------------
// Schema-Backed Command registry
// ---------------------------------------------------------------------------

/** All registered schema-backed commands, keyed by name and aliases. */
const schemaCommandRegistry = new Map<string, SchemaBackedCommand<unknown>>();

function registerSchemaCommand(cmd: SchemaBackedCommand<unknown>): void {
  schemaCommandRegistry.set(cmd.name, cmd);
  for (const alias of cmd.aliases ?? []) {
    schemaCommandRegistry.set(alias, cmd);
  }
}

// Register commands
registerSchemaCommand(threatModelCommand as SchemaBackedCommand<unknown>);

export function routeCommand(
  command: string,
  resolveSkill: (cmd: string) => string | null,
): CommandAction {
  const commandLower = command.trim().replace(/^\/+/, "").toLowerCase();

  if (commandLower === "models" || commandLower === "model") {
    return { type: "show-models" };
  }

  // Check schema-backed commands before skills
  const parts = commandLower.split(/\s+/);
  const schemaCmd = schemaCommandRegistry.get(parts[0]);
  if (schemaCmd) {
    const args = command.trim().replace(/^\/+\S+\s*/, "");
    return { type: "run-schema-command", command: schemaCmd, args };
  }

  const autopilot = command.includes("--autopilot");
  const cleanedCommand = command.replace(/\s*--autopilot\s*/g, "").trim();
  const skillContent = resolveSkill(cleanedCommand);

  if (skillContent) {
    return { type: "run-skill", content: skillContent, autopilot };
  }

  return { type: "execute-command", command };
}

// ---------------------------------------------------------------------------
// Schema-Backed Command execution
// ---------------------------------------------------------------------------

export interface ExecuteSchemaCommandInput {
  command: SchemaBackedCommand<unknown>;
  cwd: string;
  model: AIModel;
  session: SessionInfo;
  authConfig?: AIAuthConfig;
  abortSignal?: AbortSignal;
  callbacks?: ConsumeCallbacks;
  applicationIdentity?: string;
}

/**
 * Execute a Schema-Backed Command by creating a CodeAgent with the command's
 * system prompt, response schema, and tools, then streaming output via the
 * provided callbacks.
 *
 * After the agent finishes, calls `command.onResult()` to persist / transform
 * the structured result, and returns the {@link CommandOutput}.
 */
export async function executeSchemaBackedCommand(
  input: ExecuteSchemaCommandInput,
): Promise<CommandOutput> {
  const {
    command,
    cwd,
    model,
    session,
    authConfig,
    abortSignal,
    callbacks,
    applicationIdentity,
  } = input;

  const userPrompt = command.buildPrompt({ cwd, session, applicationIdentity });

  const agent = new CodeAgent({
    codebasePath: cwd,
    objective: userPrompt,
    system: command.system,
    responseSchema: command.responseSchema,
    model,
    session,
    authConfig,
    abortSignal,
    callbacks,
  });

  const agentResult = await agent.consume(callbacks);

  const modelStr = typeof model === "string" ? model : String(model);
  const ctx = { session, cwd, model: modelStr };

  const output = await command.onResult(agentResult, ctx);
  return output;
}

// ---------------------------------------------------------------------------
// Keyboard shortcut routing
// ---------------------------------------------------------------------------

interface KeyInfo {
  name: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  super?: boolean;
  raw?: string;
}

export type KeyboardAction =
  | { type: "skip" }
  | { type: "ctrl-c-abort" }
  | { type: "ctrl-c-clear" }
  | { type: "escape" }
  | { type: "toggle-verbose" }
  | { type: "toggle-expanded-logs" }
  | { type: "toggle-approval" }
  | { type: "approve" }
  | { type: "auto-approve" };

export function resolveKeyboardShortcut(
  key: KeyInfo,
  status: DashboardStatus,
  inputValue: string,
  hasPendingApprovals: boolean,
  dialogOpen: boolean,
): KeyboardAction {
  if (dialogOpen) return { type: "skip" };

  // Terminal-native copy (Cmd+C / Super+C) passes through
  if ((key.meta || key.super) && key.name === "c") return { type: "skip" };

  // Ctrl+C
  if (key.ctrl && key.name === "c") {
    if (status === "running" || status === "waiting")
      return { type: "ctrl-c-abort" };
    if (inputValue.trim()) return { type: "ctrl-c-clear" };
    return { type: "skip" };
  }

  // Escape
  if (key.name === "escape" && status !== "running" && status !== "waiting") {
    return { type: "escape" };
  }

  // Ctrl+V — toggle verbose
  if (key.ctrl && key.name === "v") return { type: "toggle-verbose" };

  // Ctrl+L — toggle expanded logs
  if (key.ctrl && key.name === "l") return { type: "toggle-expanded-logs" };

  // Shift+Tab — toggle approval
  if (key.name === "tab" && key.shift) return { type: "toggle-approval" };

  // Y to approve
  if (
    status === "waiting" &&
    hasPendingApprovals &&
    (key.name === "y" || key.raw === "Y")
  ) {
    return { type: "approve" };
  }

  // A to auto-approve
  if (
    status === "waiting" &&
    hasPendingApprovals &&
    (key.name === "a" || key.raw === "A")
  ) {
    return { type: "auto-approve" };
  }

  return { type: "skip" };
}

// ---------------------------------------------------------------------------
// Two-stage abort logic
// ---------------------------------------------------------------------------

export type AbortAction = { type: "cancel-command" } | { type: "kill-agent" };

export function resolveAbortAction(
  commandCancelled: boolean,
  cancelCommand: () => boolean,
): AbortAction {
  if (!commandCancelled && cancelCommand()) {
    return { type: "cancel-command" };
  }
  return { type: "kill-agent" };
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

export function buildOperatorSystemPrompt(
  target: string | undefined,
  operatorState: OperatorSessionState,
): string {
  return `${BASE_SYSTEM_PROMPT}

# Operator Mode

You are operating in interactive operator mode. The human operator will guide your actions through directives.

Target: ${target || "unknown"}
Stage: ${operatorState.currentStage}
Command approval: ${operatorState.requireApproval ? "enabled — the operator will approve each tool call" : "disabled — tool calls execute automatically"}`;
}

// ---------------------------------------------------------------------------
// Input focus resolution
// ---------------------------------------------------------------------------

export function resolveInputFocused(
  status: DashboardStatus,
  dialogStackLength: number,
  externalDialogOpen: boolean,
): boolean {
  return status !== "running" && dialogStackLength === 0 && !externalDialogOpen;
}

// ---------------------------------------------------------------------------
// Token usage accumulation
// ---------------------------------------------------------------------------

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export function accumulateTokenUsage(
  current: TokenUsage,
  stepInputTokens: number,
  stepOutputTokens: number,
): TokenUsage | null {
  if (stepInputTokens <= 0 && stepOutputTokens <= 0) return null;
  return {
    inputTokens: current.inputTokens + stepInputTokens,
    outputTokens: current.outputTokens + stepOutputTokens,
    totalTokens: current.totalTokens + stepInputTokens + stepOutputTokens,
  };
}
