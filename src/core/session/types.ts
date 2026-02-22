/**
 * Authentication information for testing
 */
export interface AuthenticationInfo {
  method: string; // e.g., "cookie-based session", "bearer token"
  details: string; // How to authenticate
  credentials?: string; // username:password
  cookies?: string; // Session cookies
  headers?: string; // Auth headers
}
