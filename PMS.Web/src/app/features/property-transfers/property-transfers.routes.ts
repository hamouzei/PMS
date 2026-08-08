import { Routes } from '@angular/router';

export const TRANSFER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./transfer-list.component').then(m => m.TransferListComponent)
  }
];
