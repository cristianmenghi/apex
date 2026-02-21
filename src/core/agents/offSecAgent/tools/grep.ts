import { tool } from "ai";
import { z } from "zod";
import { spawnWithAbort } from "../../../utils/process";
import type { ToolContext } from "./types";

export const grepInputSchema = z.object({
  pattern: z.string().describe("The pattern to search for"),
  directory: z
    .string()
    .optional()
    .describe(
      "Directory or file path to search in (defaults to current working directory)",
    ),
  flags: z
    .string()
    .optional()
    .describe(
      'Additional grep flags (e.g. "-rn", "-i", "-l", "-E"). -r (recursive) is added by default when searching a directory.',
    ),
  toolCallDescription: z
    .string()
    .describe(
      "A concise, human-readable description of what this tool call is doing (e.g., 'Searching for password hashes in config files')",
    ),
});

export type GrepInput = z.infer<typeof grepInputSchema>;

export type GrepResult = {
  success: boolean;
  error: string;
  output: string;
  matchCount: number;
  command: string;
};

export function grep(ctx: ToolContext) {
  return tool({
    description: `Search file contents using grep.

Runs grep with the given pattern and optional flags. When searching a
directory, -r (recursive) is included automatically unless you explicitly
provide flags that already contain it.

USEFUL FLAG COMBOS:
  -rn           recursive + line numbers (default for dirs)
  -rni          recursive + line numbers + case-insensitive
  -rl           recursive, file names only
  -E            extended regex
  -P            Perl-compatible regex
  -C 3          show 3 lines of context around matches
  --include="*.js"  restrict to certain file types

Output is capped at 50 000 characters to avoid context overflow — narrow your
search with flags or a more specific directory if results are truncated.`,
    inputSchema: grepInputSchema,
    execute: async ({ pattern, directory, flags }): Promise<GrepResult> => {
      const dir = directory || ".";
      const userFlags = flags ? flags.trim().split(/\s+/) : [];

      // Add -r by default when the user hasn't specified it and we're targeting a directory
      const hasRecursive = userFlags.some(
        (f) => /^-[a-zA-Z]*r[a-zA-Z]*$/.test(f) || f === "--recursive",
      );
      const defaultFlags = hasRecursive ? [] : ["-r"];

      const args = [...defaultFlags, ...userFlags, "--", pattern, dir];
      const command = `grep ${args.join(" ")}`;

      const result = await spawnWithAbort("grep", args, {
        timeout: 30_000,
        abortSignal: ctx.abortSignal,
      });

      if (result.killed && result.exitCode === null && result.stdout === "") {
        return {
          success: false,
          error: "Grep aborted by user",
          output: "",
          matchCount: 0,
          command: "",
        };
      }

      // grep exits 1 when no matches — that's not an error
      const noMatch = result.exitCode === 1 && result.stderr === "";
      const matchCount = result.stdout
        ? result.stdout.trimEnd().split("\n").length
        : 0;

      const output = result.truncated
        ? `${result.stdout}\n\n(truncated — narrow your search)`
        : result.stdout || "(no matches)";

      return {
        success: result.exitCode === 0 || noMatch,
        error:
          noMatch || result.exitCode === 0
            ? ""
            : result.stderr || `Exit code: ${result.exitCode}`,
        output,
        matchCount,
        command,
      };
    },
  });
}
