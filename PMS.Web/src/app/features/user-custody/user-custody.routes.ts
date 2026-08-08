import { Routes } from '@angular/router';

export const USER_CUSTODY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-custody-list.component').then(m => m.UserCustodyListComponent)
  }
];
