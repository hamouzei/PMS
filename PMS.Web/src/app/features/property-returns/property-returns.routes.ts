import { Routes } from '@angular/router';

export const RETURN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./return-list.component').then(m => m.ReturnListComponent)
  }
];
