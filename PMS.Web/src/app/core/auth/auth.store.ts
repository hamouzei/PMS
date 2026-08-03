import { Injectable, computed, signal } from '@angular/core';
import { AppUserDto, UserRole, UserRoleName } from '../models/user.model';

export interface AuthState {
  user: AppUserDto | null;
  token: string | null;
  roleName: UserRoleName | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthStore {
  private readonly stateSignal = signal<AuthState>({
    user: null,
    token: null,
    roleName: null
  });

  public readonly user = computed(() => this.stateSignal().user);
  public readonly token = computed(() => this.stateSignal().token);
  public readonly roleName = computed(() => this.stateSignal().roleName);
  public readonly isAuthenticated = computed(() => !!this.stateSignal().token && !!this.stateSignal().user);

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
}
