import { Routes } from '@angular/router';

export const HANDOVER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./handover-list.component').then(m => m.HandoverListComponent)
  }
];
