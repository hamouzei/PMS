import { Injectable, computed, inject, signal } from '@angular/core';
import { AppUserDto, UserRole, UserRoleName } from '../models/user.model';
import { TokenStorageService } from './token-storage.service';
import { JwtPayload } from '../utils/jwt.utils';

export interface AuthState {
  user: AppUserDto | null;
  token: string | null;
  roleName: UserRoleName | null;
}

/** Claim URIs emitted by ASP.NET Core's ClaimTypes constants. */
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly stateSignal = signal<AuthState>({
    user: null,
    token: null,
    roleName: null
  });

  public readonly user = computed(() => this.stateSignal().user);
  public readonly token = computed(() => this.stateSignal().token);
  public readonly roleName = computed(() => this.stateSignal().roleName);
  public readonly isAuthenticated = computed(() => !!this.stateSignal().token && !!this.stateSignal().user);

  constructor() {
    this.tryRehydrate();
  }

  public setAuth(user: AppUserDto, token: string, roleName: string): void {
    const roleEnum = UserRole[roleName as keyof typeof UserRole] || user.role;
    const typedRoleName = (UserRole[roleEnum] || roleName) as UserRoleName;

    this.stateSignal.set({
      user: { ...user, role: roleEnum },
      token,
      roleName: typedRoleName
    });
  }

  public clearAuth(): void {
    this.stateSignal.set({
      user: null,
      token: null,
      roleName: null
    });
  }

  public hasRole(requiredRoles: string[]): boolean {
    const current = this.roleName();
    if (!current) return false;
    return requiredRoles.includes(current);
  }

  /**
   * Rehydrates the in-memory auth state from a valid JWT persisted in localStorage.
   * Called automatically on construction (app startup).
   * If the token is expired, getValidToken() already clears it, so nothing is populated.
   */
  private tryRehydrate(): void {
    const token = this.tokenStorage.getValidToken();
    if (!token) return;

    const payload = this.tokenStorage.getDecodedPayload();
    if (!payload) return;

    const roleName = payload[CLAIM_ROLE] as string || '';
    const roleEnum = UserRole[roleName as keyof typeof UserRole] || UserRole.Employee;
    const typedRoleName = (UserRole[roleEnum] || roleName) as UserRoleName;

    const user: AppUserDto = {
      id: payload.sub,
      employeeId: payload.employee_id || payload.sub,
      userName: (payload[CLAIM_NAME] as string) || '',
      fullName: payload.full_name || (payload[CLAIM_NAME] as string) || '',
      role: roleEnum,
      isActive: true
    };

    this.stateSignal.set({ user, token, roleName: typedRoleName });
  }
}

