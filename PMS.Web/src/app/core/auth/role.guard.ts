import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const allowedRoles = (route.data['roles'] as string[]) || [];

  if (allowedRoles.length === 0 || authStore.hasRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
