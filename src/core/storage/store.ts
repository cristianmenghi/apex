/**
 * Generic typed store interface for structured data.
 * Implementations handle serialization, validation, and persistence.
 */
export interface Store<T> {
  /** Retrieve a value by key. Throws StoreNotFoundError if missing. */
  get(key: string[]): Promise<T>;

  /** Store a value at key. Validates before writing. Creates parent dirs as needed. */
  put(key: string[], data: T): Promise<void>;

  /**
   * Read-modify-write. Reads current value, applies mutation, validates result,
   * and writes back. Returns the updated value. Holds a write lock for the
   * entire operation.
   */
  update(key: string[], fn: (draft: T) => void): Promise<T>;

  /** Delete a value by key. No-op if key doesn't exist. */
  delete(key: string[]): Promise<void>;

  /**
   * List all keys under a prefix. Returns an array of key arrays.
   * Each key array is the full key (including prefix segments).
   */
  list(prefix: string[]): Promise<string[][]>;

  /** Check whether a key exists. */
  exists(key: string[]): Promise<boolean>;
}

/**
 * Raw (untyped) store for non-JSON content: logs, markdown, binary files, etc.
 */
export interface RawStore {
  /** Write raw string content at key. Creates parent dirs as needed. */
  putRaw(key: string[], content: string): Promise<void>;

  /** Append raw string content to the file at key. Creates if missing. */
  appendRaw(key: string[], content: string): Promise<void>;

  /** Read raw string content from key. Throws StoreNotFoundError if missing. */
  getRaw(key: string[]): Promise<string>;

  /** Write binary content at key. Creates parent dirs as needed. */
  putBinary(key: string[], content: Buffer): Promise<void>;
}

/**
 * Thrown when a key does not exist in the store.
 */
export class StoreNotFoundError extends Error {
  readonly code = "STORE_NOT_FOUND";

  constructor(key: string[]) {
    super(`Key not found: ${key.join("/")}`);
    this.name = "StoreNotFoundError";
  }
}

/**
 * Thrown when data fails schema validation on read or write.
 */
export class StoreValidationError extends Error {
  readonly code = "STORE_VALIDATION_ERROR";
  readonly issues: unknown[];

  constructor(key: string[], issues: unknown[]) {
    super(
      `Validation failed for key "${key.join("/")}":\n${JSON.stringify(issues, null, 2)}`,
    );
    this.name = "StoreValidationError";
    this.issues = issues;
  }
}
