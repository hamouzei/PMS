import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { decodeJwtPayload, isTokenExpired, JwtPayload } from '../utils/jwt.utils';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  public getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
  }

  /**
   * Returns the stored token only if it exists and is not expired.
   * Clears stale tokens automatically so the auth guard won't be fooled.
   */
  public getValidToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    if (isTokenExpired(token)) {
      this.clear();
      return null;
    }

    return token;
  }

  /**
   * Decodes the JWT payload from the stored token.
   * Returns null if no valid token exists or if decoding fails.
   */
  public getDecodedPayload(): JwtPayload | null {
    const token = this.getValidToken();
    if (!token) return null;
    return decodeJwtPayload(token);
  }

  public setToken(token: string): void {
    localStorage.setItem(environment.tokenKey, token);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(environment.refreshTokenKey);
  }

  public setRefreshToken(refreshToken: string): void {
    localStorage.setItem(environment.refreshTokenKey, refreshToken);
  }

  public clear(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
  }
}
