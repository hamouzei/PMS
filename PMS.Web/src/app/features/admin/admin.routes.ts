import { Routes } from '@angular/router';
import { UserListComponent } from './user-list.component';
import { roleGuard } from '../../core/auth/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [roleGuard],
    data: { roles: ['PropertyAdmin'] }
  }
];
