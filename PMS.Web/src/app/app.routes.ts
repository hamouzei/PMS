import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },
      {
        path: 'master-data',
        loadChildren: () => import('./features/master-data/master-data.routes').then(m => m.MASTER_DATA_ROUTES)
      },
      // ── Phase 4: Receiving & Stock Control ──────────────────────────
      {
        path: 'receiving',
        loadComponent: () => import('./features/receiving/receiving-list.component').then(m => m.ReceivingListComponent)
      },
      {
        path: 'stock-control',
        loadChildren: () => import('./features/stock-control/stock-control.routes').then(m => m.STOCK_CONTROL_ROUTES)
      },
      // ── Phase 5: Requisitions & Issuing ─────────────────────────────
      {
        path: 'store-requisitions',
        loadComponent: () => import('./features/store-requisitions/store-request-list.component').then(m => m.StoreRequestListComponent)
      },
      {
        path: 'purchase-requisitions',
        loadComponent: () => import('./features/purchase-requisitions/purchase-request-list.component').then(m => m.PurchaseRequestListComponent)
      },
      {
        path: 'issuing',
        loadComponent: () => import('./features/issuing/issuing-list.component').then(m => m.IssuingListComponent)
      },
      // ── Phase 6: Custody, Returns, Transfers & Handovers ────────────
      {
        path: 'user-custody',
        loadChildren: () => import('./features/user-custody/user-custody.routes').then(m => m.USER_CUSTODY_ROUTES)
      },
      {
        path: 'property-returns',
        loadChildren: () => import('./features/property-returns/property-returns.routes').then(m => m.RETURN_ROUTES)
      },
      {
        path: 'property-transfers',
        loadChildren: () => import('./features/property-transfers/property-transfers.routes').then(m => m.TRANSFER_ROUTES)
      },
      {
        path: 'property-handovers',
        loadChildren: () => import('./features/property-handovers/property-handovers.routes').then(m => m.HANDOVER_ROUTES)
      },
      // ── Phase 7: Disposal, Annual Inventory & Compliance ────────────
      {
        path: 'disposal',
        loadComponent: () => import('./features/disposal/disposal-list.component').then(m => m.DisposalListComponent)
      },
      {
        path: 'annual-inventory',
        loadComponent: () => import('./features/annual-inventory/annual-inventory-list.component').then(m => m.AnnualInventoryListComponent)
      },
      {
        path: 'compliance',
        loadComponent: () => import('./features/compliance/compliance-list.component').then(m => m.ComplianceListComponent)
      },
      // ── Phase 8: Reports & Dashboard ────────────────────────────────
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES)
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
