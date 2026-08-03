import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HasRoleDirective],
  template: `
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <div class="nav-section-title">MAIN MENU</div>
        <ng-container *ngFor="let item of menuItems">
          <a
            *ngIf="!item.roles || authStore.hasRole(item.roles)"
            [routerLink]="item.path"
            routerLinkActive="active"
            class="nav-item">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-title">{{ item.title }}</span>
          </a>
        </ng-container>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: calc(100vh - 64px);
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      overflow-y: auto;
      padding: 1rem 0.75rem;
      position: sticky; top: 64px;
    }
    .nav-section-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-on-navy-muted);
      letter-spacing: 0.05em;
      padding: 0.5rem 0.75rem;
      margin-bottom: 0.5rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-on-navy-muted);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      margin-bottom: 0.25rem;

      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }

      &.active {
        background-color: var(--ecx-gold-primary);
        color: #0F172A;
        font-weight: 600;
      }
    }
    .nav-icon { font-size: 1.125rem; }
  `]
})
export class SidebarComponent {
  public readonly authStore = inject(AuthStore);

  public readonly menuItems: MenuItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: '📊' },
    { title: 'Store Requisitions', path: '/store-requisitions', icon: '📝' },
    { title: 'Purchase Requisitions', path: '/purchase-requisitions', icon: '🛒' },
    { title: 'Receiving Management', path: '/receiving', icon: '📦', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'Quality Inspection', path: '/inspection', icon: '🔍', roles: ['Inspector', 'PropertyAdmin'] },
    { title: 'Property Issuing', path: '/issuing', icon: '🎟️', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'My User Custody (UC)', path: '/user-custody', icon: '👤' },
    { title: 'Property Returns', path: '/property-returns', icon: '↩️' },
    { title: 'Property Transfers', path: '/property-transfers', icon: '🔄' },
    { title: 'Property Handovers', path: '/property-handovers', icon: '🤝', roles: ['PropertyAdmin', 'DepartmentManager', 'Storekeeper'] },
    { title: 'Disposal Stock', path: '/disposals', icon: '🗑️', roles: ['ComplianceOfficer', 'PropertyAdmin'] },
    { title: 'Annual Inventory', path: '/annual-inventory', icon: '📋', roles: ['PropertyAdmin', 'Storekeeper', 'DepartmentManager'] },
    { title: 'Compliance Audit', path: '/compliance', icon: '🛡️', roles: ['ComplianceOfficer', 'PropertyAdmin'] },
    { title: 'Stock Control & Ledger', path: '/stock-control/bin-card', icon: '📊', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'Safety Boxes', path: '/safety-boxes', icon: '🔒', roles: ['PropertyAdmin', 'Storekeeper'] },
    { title: 'Master Data & Config', path: '/master-data/items', icon: '⚙️', roles: ['PropertyAdmin', 'Storekeeper'] },
    { title: 'MIS Reports', path: '/reports/stock-summary', icon: '📈', roles: ['PropertyAdmin', 'DepartmentManager', 'ComplianceOfficer', 'ReportViewer', 'FinanceOfficer'] },
    { title: 'User Administration', path: '/admin/users', icon: '👥', roles: ['PropertyAdmin'] }
  ];
}
