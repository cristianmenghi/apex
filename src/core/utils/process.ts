import { spawn } from "child_process";

export interface SpawnResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  killed: boolean;
  truncated: boolean;
}

export interface SpawnOptions {
  timeout: number;
  abortSignal?: AbortSignal;
  maxOutput?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

const DEFAULT_MAX_OUTPUT = 50_000;

/**
 * Spawn a child process with abort signal and timeout support.
 *
 * Handles the full lifecycle: pre-spawn abort check, timeout-based SIGTERM,
 * abort listener wiring/cleanup, and stdout/stderr truncation.
 */
export function spawnWithAbort(
  cmd: string,
  args: string[],
  opts: SpawnOptions,
): Promise<SpawnResult> {
  const maxOutput = opts.maxOutput ?? DEFAULT_MAX_OUTPUT;

  if (opts.abortSignal?.aborted) {
    return Promise.resolve({
      stdout: "",
      stderr: "",
      exitCode: null,
      killed: true,
      truncated: false,
    });
  }

  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...(opts.cwd ? { cwd: opts.cwd } : {}),
      ...(opts.env ? { env: opts.env } : {}),
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timeoutTimer = setTimeout(() => {
      killed = true;
      child.kill("SIGTERM");
    }, opts.timeout);

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeoutTimer);
      const truncated = stdout.length > maxOutput;
      resolve({
        stdout: truncated ? stdout.substring(0, maxOutput) : stdout,
        stderr,
        exitCode: code,
        killed,
        truncated,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timeoutTimer);
      resolve({
        stdout,
        stderr: err.message,
        exitCode: null,
        killed: false,
        truncated: false,
      });
    });

    // Wire up abort signal
    if (opts.abortSignal) {
      const abortHandler = () => {
        killed = true;
        child.kill("SIGTERM");
      };
      opts.abortSignal.addEventListener("abort", abortHandler, { once: true });
      child.on("close", () => {
        opts.abortSignal!.removeEventListener("abort", abortHandler);
      });
    }
  });
}
