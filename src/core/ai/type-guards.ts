/**
 * Type guards and helper functions for the Vercel AI SDK types.
 *
 * These exist to replace `as unknown` casts with properly typed alternatives.
 * Some SDK types are difficult to construct synthetically (e.g., StepResult),
 * so we provide well-typed factory functions that document why the cast is needed.
 */

import type {
  LanguageModelUsage,
  StepResult,
  StreamTextResult,
  TextStreamPart,
  ToolSet,
} from "ai";

// ---------------------------------------------------------------------------
// Type guard: error chunk in fullStream
// ---------------------------------------------------------------------------

/**
 * The AI SDK's TextStreamPart union includes `{ type: 'error'; error: unknown }`,
 * but TypeScript's control-flow narrowing doesn't always refine to that variant
 * when checking `"error" in chunk` (because other variants may also have optional
 * properties). This guard explicitly narrows to the error shape.
 */
export function isErrorChunk(
  chunk: TextStreamPart<ToolSet>,
): chunk is Extract<TextStreamPart<ToolSet>, { type: "error" }> {
  return chunk.type === "error";
}

/**
 * Extract the error value from a chunk that has an `error` property.
 * Handles both the typed `{ type: 'error'; error: unknown }` variant and
 * any unexpected chunk shape where `"error"` appears as a property.
 */
export function extractChunkError(chunk: TextStreamPart<ToolSet>): unknown {
  if (isErrorChunk(chunk)) {
    return chunk.error;
  }
  // Fallback for chunks that have an `error` property but aren't typed as error chunks.
  // This can happen with provider-specific extensions.
  if ("error" in chunk) {
    return (chunk as Record<string, unknown>).error;
  }
  return chunk;
}

// ---------------------------------------------------------------------------
// Proxy property accessor for StreamTextResult
// ---------------------------------------------------------------------------

/**
 * Safely access a property on a StreamTextResult by name.
 *
 * StreamTextResult is an interface with many readonly properties. When using a
 * Proxy handler, the `prop` is a `string | symbol`, and TypeScript can't verify
 * dynamic property access on the interface. This helper encapsulates the single
 * necessary cast.
 */
export function getStreamProperty(
  stream: StreamTextResult<ToolSet, never>,
  prop: string | symbol,
): unknown {
  // StreamTextResult is a plain object at runtime, so indexing by prop is safe.
  // The two-step cast (through unknown) is necessary because TypeScript interfaces
  // don't support dynamic property access via string | symbol keys, and the
  // StreamTextResult interface doesn't overlap with Record<string | symbol, unknown>.
  return (stream as unknown as Record<string | symbol, unknown>)[prop];
}

// ---------------------------------------------------------------------------
// Synthetic StepResult factory
// ---------------------------------------------------------------------------

/**
 * Create a minimal StepResult for reporting token usage from non-step operations
 * (e.g., tool repair, summarization). The Vercel AI SDK's StepResult type requires
 * many fields that don't apply to synthetic usage-reporting events.
 *
 * This factory fills in all required fields with empty/default values and sets the
 * usage and response fields from the provided arguments.
 *
 * The cast to StepResult is necessary because constructing a fully-typed StepResult
 * outside the SDK internals is impractical — the type uses mapped types over the
 * generic TOOLS parameter that can't be satisfied with concrete values.
 */
export function createSyntheticStepResult(opts: {
  usage: LanguageModelUsage;
  responseId: string;
}): StepResult<ToolSet> {
  return {
    content: [],
    text: "",
    reasoning: [],
    reasoningText: undefined,
    files: [],
    sources: [],
    toolCalls: [],
    staticToolCalls: [],
    dynamicToolCalls: [],
    toolResults: [],
    staticToolResults: [],
    dynamicToolResults: [],
    finishReason: "stop",
    rawFinishReason: undefined,
    usage: opts.usage,
    warnings: undefined,
    request: {},
    response: {
      id: opts.responseId,
      timestamp: new Date(),
      modelId: "",
      messages: [],
    },
    providerMetadata: undefined,
  } as StepResult<ToolSet>;
}

// ---------------------------------------------------------------------------
// Synthetic TextStreamPart factories
// ---------------------------------------------------------------------------

/**
 * Create a synthetic tool-call TextStreamPart for emitting into a wrapped stream.
 *
 * The Vercel AI SDK's tool-call variant uses mapped types over TOOLS that can't be
 * constructed with arbitrary toolName strings outside the SDK. This factory provides
 * a well-typed entry point for creating synthetic tool-call events (e.g., for
 * summarization progress indicators).
 */
export function createSyntheticToolCallPart(opts: {
  toolCallId: string;
  toolName: string;
  input: string;
}): TextStreamPart<ToolSet> {
  // The cast is needed because TypedToolCall<ToolSet> uses mapped types that
  // require toolName to be `keyof ToolSet`, but we're creating a synthetic
  // event with an arbitrary tool name for display purposes only.
  return {
    type: "tool-call" as const,
    toolCallId: opts.toolCallId,
    toolName: opts.toolName,
    input: opts.input,
  } as TextStreamPart<ToolSet>;
}

/**
 * Create a synthetic tool-result TextStreamPart for emitting into a wrapped stream.
 *
 * Same rationale as createSyntheticToolCallPart — the mapped types over TOOLS
 * prevent constructing tool-result events with arbitrary tool names.
 */
export function createSyntheticToolResultPart(opts: {
  toolCallId: string;
  toolName: string;
  input: string;
  result: string;
}): TextStreamPart<ToolSet> {
  // The cast is needed because TypedToolResult<ToolSet> uses mapped types that
  // require toolName to be `keyof ToolSet`.
  return {
    type: "tool-result" as const,
    toolCallId: opts.toolCallId,
    toolName: opts.toolName,
    input: opts.input,
    output: opts.result,
  } as TextStreamPart<ToolSet>;
}

// ---------------------------------------------------------------------------
// Synthetic StreamTextResult factory
// ---------------------------------------------------------------------------

/**
 * Create a StreamTextResult-like object that delegates most properties to a
 * promise-resolved inner stream. Used for the summarization stream wrapper.
 *
 * The Vercel AI SDK's StreamTextResult interface has many properties and methods.
 * Constructing one fully outside the SDK is not possible without its internal
 * machinery. This factory creates the minimum viable shape and casts once,
 * concentrating the single necessary `as unknown as` in one documented location.
 */
export function createDelegatedStreamResult(
  fullStream: AsyncIterable<TextStreamPart<ToolSet>>,
  delegate: Promise<StreamTextResult<ToolSet, never>>,
): StreamTextResult<ToolSet, never> {
  return {
    fullStream,
    text: delegate.then((s) => s.text),
    content: delegate.then((s) => s.content),
    reasoning: delegate.then((s) => s.reasoning),
    reasoningText: delegate.then((s) => s.reasoningText),
    toolCalls: delegate.then((s) => s.toolCalls),
    toolResults: delegate.then((s) => s.toolResults),
    usage: delegate.then((s) => s.usage),
    finishReason: delegate.then((s) => s.finishReason),
    warnings: delegate.then((s) => s.warnings),
    response: delegate.then((s) => s.response),
    files: delegate.then((s) => s.files),
    sources: delegate.then((s) => s.sources),
    staticToolCalls: delegate.then((s) => s.staticToolCalls),
    dynamicToolCalls: delegate.then((s) => s.dynamicToolCalls),
    pipeTextStreamToResponse: async (response: unknown, init?: unknown) => {
      const stream = await delegate;
      return stream.pipeTextStreamToResponse(
        response as Parameters<
          StreamTextResult<ToolSet, never>["pipeTextStreamToResponse"]
        >[0],
        init as Parameters<
          StreamTextResult<ToolSet, never>["pipeTextStreamToResponse"]
        >[1],
      );
    },
    toDataStream: (_options?: unknown) => {
      throw new Error("toDataStream not supported on summarization stream");
    },
    toDataStreamResponse: (_options?: unknown) => {
      throw new Error(
        "toDataStreamResponse not supported on summarization stream",
      );
    },
  } as unknown as StreamTextResult<ToolSet, never>;
}
