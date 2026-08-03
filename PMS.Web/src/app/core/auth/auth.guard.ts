import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (authStore.isAuthenticated() || tokenStorage.getToken()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
};
