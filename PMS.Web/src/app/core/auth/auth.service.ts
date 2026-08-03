import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppUserDto, LoginRequest, LoginResponse, RefreshTokenRequest, UserRole } from '../models/user.model';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly tokenStorage = inject(TokenStorageService);

  public login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.token);
        this.tokenStorage.setRefreshToken(response.refreshToken);

        const roleEnum = UserRole[response.role as keyof typeof UserRole] || UserRole.Employee;
        const mockUser: AppUserDto = {
          id: response.employeeId,
          employeeId: response.employeeId,
          userName: response.userName,
          fullName: response.userName,
          role: roleEnum,
          isActive: true
        };

        this.authStore.setAuth(mockUser, response.token, response.role);
      })
    );
  }

  public refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    const payload: RefreshTokenRequest = { refreshToken: refreshToken || '' };

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/refresh`, payload).pipe(
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
