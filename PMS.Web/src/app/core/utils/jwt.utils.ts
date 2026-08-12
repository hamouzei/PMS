/**
 * Lightweight JWT decoding utilities.
 * Only decodes the payload (no signature verification — that's the server's job).
 * Used client-side to check expiry and extract claims for session rehydration.
 */

export interface JwtPayload {
  sub: string;
  /** ClaimTypes.Name — maps to user.UserName */
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  /** ClaimTypes.NameIdentifier */
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  /** ClaimTypes.Role */
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  employee_id?: string;
  full_name?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Decodes a JWT payload without verification.
 * Returns null if the token is malformed.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64url → Base64 → decoded string
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token's `exp` claim is in the past (or missing).
 * Includes a 30-second buffer to avoid race conditions with in-flight requests.
 */
export function isTokenExpired(token: string, bufferSeconds: number = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds + bufferSeconds;
}
