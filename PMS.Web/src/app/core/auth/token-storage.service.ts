import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenStorageService {
  public getToken(): string | null {
    return localStorage.getItem(environment.tokenKey);
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
