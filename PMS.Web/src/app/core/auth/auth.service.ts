import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUserDto, LoginRequest, LoginResponse, RefreshTokenRequest, UserRole } from '../models/user.model';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';
import { decodeJwtPayload } from '../utils/jwt.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly tokenStorage = inject(TokenStorageService);

  public login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/auth/login', request).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.tokenStorage.setRefreshToken(response.refreshToken);

        const roleEnum = UserRole[response.role as keyof typeof UserRole] || UserRole.Employee;

        // Extract the GUID user ID from the JWT `sub` claim.
        // The login response only provides employeeId (e.g. "PAS-ADMIN"),
        // but backend entities reference users by their GUID.
        const payload = decodeJwtPayload(response.token);
        const userId = payload?.sub || response.employeeId;

        const user: AppUserDto = {
          id: userId,
          employeeId: response.employeeId,
          userName: response.userName,
          fullName: response.userName,
          role: roleEnum,
          isActive: true
        };

        this.authStore.setAuth(user, response.token, response.role);
      })
    );
  }

  public refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    const payload: RefreshTokenRequest = { refreshToken: refreshToken || '' };

    return this.http.post<LoginResponse>('/auth/refresh', payload).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.tokenStorage.setRefreshToken(response.refreshToken);
        if (this.authStore.user()) {
          this.authStore.setAuth(this.authStore.user()!, response.token, response.role);
        }
      })
    );
  }

  public logout(): void {
    this.tokenStorage.clear();
    this.authStore.clearAuth();
    this.router.navigate(['/auth/login']);
  }
}
