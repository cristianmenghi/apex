import { tool } from "ai";
import { z } from "zod";
import { spawnWithAbort } from "../../../utils/process";
import type { ToolContext } from "./types";

export const executeCommandInputSchema = z.object({
  command: z.string().describe("The shell command to execute"),
  timeout: z
    .number()
    .optional()
    .describe("Timeout in milliseconds (default: 30000)"),
  toolCallDescription: z
    .string()
    .describe(
      "A concise, human-readable description of what this tool call is doing (e.g., 'Scanning for open ports on target')",
    ),
});

export type ExecuteCommandInput = z.infer<typeof executeCommandInputSchema>;

export type ExecuteCommandResult = {
  success: boolean;
  error: string;
  stdout: string;
  stderr: string;
  command: string;
};

export function executeCommand(ctx: ToolContext) {
  return tool({
    description: `Execute a shell command for penetration testing activities.

COMMON COMMANDS FOR BLACK BOX TESTING:

RECONNAISSANCE:
- nmap -sV -sC <target>              # Service version detection + default scripts
- nmap -p- <target>                  # Scan all ports
- dig <domain>                       # DNS lookup
- whois <domain>                     # Domain registration info

WEB APPLICATION TESTING:
- curl -i <url>                      # HTTP request with headers
- curl -X POST -d "data" <url>       # POST request
- nikto -h <host>                    # Web server scanner
- gobuster dir -u <url> -w <wordlist> # Directory enumeration
- ffuf -u <url>/FUZZ -w <wordlist>   # Web fuzzer

SSL/TLS TESTING:
- openssl s_client -connect <host>:<port>
- nmap --script ssl-enum-ciphers -p 443 <host>

OUTPUT HANDLING:
- Use 2>&1 to capture stderr
- Use timeout command for long-running scans

IMPORTANT: Always analyze results and adjust your approach based on findings.`,
    inputSchema: executeCommandInputSchema,
    execute: async ({
      command,
      timeout = 30000,
    }): Promise<ExecuteCommandResult> => {
      const shellCmd = process.platform === "win32" ? "cmd" : "bash";
      const shellArgs =
        process.platform === "win32" ? ["/c", command] : ["-lc", command];

      const result = await spawnWithAbort(shellCmd, shellArgs, {
        timeout,
        abortSignal: ctx.abortSignal,
      });

      if (result.killed && result.exitCode === null && result.stdout === "") {
        return {
          success: false,
          error: "Command aborted by user",
          stdout: "",
          stderr: "",
          command,
        };
      }

      return {
        success: result.exitCode === 0 && !result.killed,
        stdout: result.truncated
          ? `${result.stdout}...\n\n(truncated) call the command again with grep / tail to paginate`
          : result.stdout || "(no output)",
        stderr: result.stderr || "",
        command,
        error: result.killed
          ? "Command timed out"
          : result.exitCode !== 0
            ? `Exit code: ${result.exitCode}`
            : "",
      };
    },
  });
}
