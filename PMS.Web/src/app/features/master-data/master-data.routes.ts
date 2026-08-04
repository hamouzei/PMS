import { Routes } from '@angular/router';
import { MasterDataShellComponent } from './master-data-shell.component';
import { roleGuard } from '../../core/auth/role.guard';

export const MASTER_DATA_ROUTES: Routes = [
  {
    path: '',
    component: MasterDataShellComponent,
    canActivate: [roleGuard],
    data: { roles: ['PropertyAdmin', 'Storekeeper', 'ProcurementOfficer'] }
  },
  {
    path: ':tab',
    component: MasterDataShellComponent,
    canActivate: [roleGuard],
    data: { roles: ['PropertyAdmin', 'Storekeeper', 'ProcurementOfficer'] }
  }
];
