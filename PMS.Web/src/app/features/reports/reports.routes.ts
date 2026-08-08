import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  { path: '', redirectTo: 'stock-summary', pathMatch: 'full' },
  {
    path: 'stock-summary',
    loadComponent: () => import('./stock-summary-report.component').then(m => m.StockSummaryReportComponent)
  },
  {
    path: 'movements',
    loadComponent: () => import('./property-movement-report.component').then(m => m.PropertyMovementReportComponent)
  },
  {
    path: 'audit-trail',
    loadComponent: () => import('./audit-trail-report.component').then(m => m.AuditTrailReportComponent)
  }
];
