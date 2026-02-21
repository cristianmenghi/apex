export const TOOL_DEFAULTS = {
  timeouts: {
    command: 30_000,
    grep: 30_000,
    http: 10_000,
    pocExecution: 60_000,
  },
  truncation: {
    commandOutput: 50_000,
    grepOutput: 50_000,
    httpResponseBody: 5_000,
    fileContent: 100_000,
    directoryEntries: 5_000,
  },
  limits: {
    maxPocAttempts: 3,
  },
} as const;
