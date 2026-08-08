import { Routes } from '@angular/router';

export const STOCK_CONTROL_ROUTES: Routes = [
  { path: '', redirectTo: 'balances', pathMatch: 'full' },
  {
    path: 'balances',
    loadComponent: () => import('./stock-balances.component').then(m => m.StockBalancesComponent)
  },
  {
    path: 'bin-card',
    loadComponent: () => import('./bin-card-view.component').then(m => m.BinCardViewComponent)
  },
  {
    path: 'low-stock',
    loadComponent: () => import('./low-stock-alerts.component').then(m => m.LowStockAlertsComponent)
  }
];
