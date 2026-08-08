import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthStore } from '../../core/auth/auth.store';
import { EthiopianCalendarService } from '../../core/services/ethiopian-calendar.service';
import { ReportsApiService } from '../../core/services/reports-api.service';
import { DashboardKpiResponse } from '../../core/models/reports.model';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { KpiTileComponent } from '../../shared/components/kpi-tile/kpi-tile.component';
import { NotificationsDrawerComponent } from './notifications-drawer.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface QuickAction {
  icon: string;
  label: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EthiopianDatePipe, KpiTileComponent, NotificationsDrawerComponent, IconComponent],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h2>Welcome back, {{ authStore.user()?.fullName || 'User' }}</h2>
          <p class="subtitle">Today is {{ today | ethiopianDate }} · {{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <div class="header-actions">
          <button class="notification-bell" (click)="showNotifications = !showNotifications" [class.has-unread]="hasUnread" title="Notifications">
            <app-icon name="bell" [size]="20"></app-icon>
            <span *ngIf="hasUnread" class="unread-dot"></span>
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <section class="section">
        <h3 class="section-title">System Overview</h3>
        <div class="kpi-grid">
          <app-kpi-tile icon="package" [value]="kpi?.stockItems ?? 0" label="Stock Items" subtitle="Total items in inventory" [loading]="loading" routerLink="/stock-control" (click)="go('/stock-control')"></app-kpi-tile>
          <app-kpi-tile icon="alert-triangle" [value]="kpi?.lowStock ?? 0" label="Low Stock Alerts" subtitle="Below minimum level" [alert]="(kpi?.lowStock ?? 0) > 0" [loading]="loading" routerLink="/stock-control/low-stock" (click)="go('/stock-control/low-stock')"></app-kpi-tile>
          <app-kpi-tile icon="file-text" [value]="kpi?.pendingStoreRequests ?? 0" label="Pending SRs" subtitle="Awaiting approval" [alert]="(kpi?.pendingStoreRequests ?? 0) > 0" [loading]="loading" routerLink="/store-requisitions" (click)="go('/store-requisitions')"></app-kpi-tile>
          <app-kpi-tile icon="shopping-cart" [value]="kpi?.pendingPurchaseRequests ?? 0" label="Pending PRs" subtitle="Awaiting approval" [alert]="(kpi?.pendingPurchaseRequests ?? 0) > 0" [loading]="loading" routerLink="/purchase-requisitions" (click)="go('/purchase-requisitions')"></app-kpi-tile>
          <app-kpi-tile icon="inbox" [value]="kpi?.pendingReceiving ?? 0" label="Pending Receiving" subtitle="Awaiting inspection" [loading]="loading" routerLink="/receiving" (click)="go('/receiving')"></app-kpi-tile>
          <app-kpi-tile icon="search" [value]="kpi?.pendingInspections ?? 0" label="Pending Inspections" subtitle="Awaiting quality check" [loading]="loading" routerLink="/receiving" (click)="go('/receiving')"></app-kpi-tile>
          <app-kpi-tile icon="rotate-ccw" [value]="kpi?.pendingReturns ?? 0" label="Pending Returns" subtitle="RMRN awaiting approval" [loading]="loading" routerLink="/property-returns" (click)="go('/property-returns')"></app-kpi-tile>
          <app-kpi-tile icon="arrow-left-right" [value]="kpi?.pendingTransfers ?? 0" label="Pending Transfers" subtitle="RMTN awaiting authorization" [loading]="loading" routerLink="/property-transfers" (click)="go('/property-transfers')"></app-kpi-tile>
          <app-kpi-tile icon="handshake" [value]="kpi?.pendingHandovers ?? 0" label="Pending Handovers" subtitle="Awaiting authorization" [loading]="loading" routerLink="/property-handovers" (click)="go('/property-handovers')"></app-kpi-tile>
          <app-kpi-tile icon="trash-2" [value]="kpi?.pendingDisposals ?? 0" label="Pending Disposals" subtitle="Awaiting committee approval" [loading]="loading" routerLink="/disposal" (click)="go('/disposal')"></app-kpi-tile>
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="section" *ngIf="visibleActions.length > 0">
        <h3 class="section-title">Quick Actions</h3>
        <div class="quick-actions">
          <button *ngFor="let a of visibleActions" class="quick-action-btn" (click)="go(a.route)">
            <span class="qa-icon">
              <app-icon [name]="a.icon" [size]="18"></app-icon>
            </span>
            <span class="qa-label">{{ a.label }}</span>
          </button>
        </div>
      </section>

      <!-- Notifications Drawer -->
      <app-notifications-drawer *ngIf="showNotifications"
        (closed)="showNotifications = false" (unreadCount)="onUnreadCount($event)">
      </app-notifications-drawer>
    </div>
  `,
  styles: [`
    .dashboard-container { display: flex; flex-direction: column; gap: 2rem; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .header-actions { display: flex; gap: 0.5rem; }
    .notification-bell { position: relative; display: inline-flex; align-items: center; justify-content: center; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem 0.75rem; cursor: pointer; color: var(--text-primary); transition: background 0.2s; &:hover { background: var(--bg-surface-hover); } &.has-unread { animation: bell-pulse 2s infinite; } }
    .unread-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--ecx-danger); }
    @keyframes bell-pulse { 0%, 100% { transform: rotate(0); } 10% { transform: rotate(10deg); } 20% { transform: rotate(-10deg); } 30% { transform: rotate(5deg); } 40% { transform: rotate(0); } }
    .section { }
    .section-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .quick-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .quick-action-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; color: var(--text-primary); transition: all 0.2s ease; &:hover { border-color: var(--ecx-gold-primary); background: rgba(212, 175, 55, 0.05); transform: translateY(-1px); box-shadow: var(--shadow-sm); } }
    .qa-icon { display: inline-flex; align-items: center; color: var(--icon-accent); }
    .qa-label { white-space: nowrap; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  public readonly authStore = inject(AuthStore);
  public readonly ethCalendar = inject(EthiopianCalendarService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  public readonly today = new Date();
  public kpi: DashboardKpiResponse | null = null;
  public loading = true;
  public showNotifications = false;
  public hasUnread = false;

  private readonly allActions: QuickAction[] = [
    { icon: 'inbox', label: 'New Receiving Note', route: '/receiving', roles: ['Storekeeper', 'PropertyAdmin'] },
    { icon: 'file-text', label: 'New Store Request', route: '/store-requisitions', roles: ['Employee', 'DepartmentManager', 'Storekeeper'] },
    { icon: 'shopping-cart', label: 'New Purchase Request', route: '/purchase-requisitions', roles: ['Employee', 'ProcurementOfficer'] },
    { icon: 'package', label: 'Issue Stock', route: '/issuing', roles: ['Storekeeper', 'PropertyAdmin'] },
    { icon: 'rotate-ccw', label: 'Return Property', route: '/property-returns', roles: ['Employee', 'Storekeeper'] },
    { icon: 'arrow-left-right', label: 'Transfer Property', route: '/property-transfers', roles: ['Employee', 'Storekeeper'] },
    { icon: 'bar-chart-3', label: 'Stock Summary Report', route: '/reports/stock-summary', roles: ['PropertyAdmin', 'Storekeeper', 'DepartmentManager'] },
    { icon: 'search', label: 'Audit Trail', route: '/reports/audit-trail', roles: ['PropertyAdmin', 'ComplianceOfficer'] }
  ];

  get visibleActions(): QuickAction[] {
    return this.allActions.filter(a => this.authStore.hasRole(a.roles));
  }

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadKpis(): void {
    this.loading = true;
    this.reportsApi.getDashboardKpis()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (kpi) => { this.kpi = kpi; this.loading = false; },
        error: () => { this.loading = false; }
      });
  }

  go(route: string): void { this.router.navigateByUrl(route); }

  onUnreadCount(count: number): void { this.hasUnread = count > 0; }
}
