import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { IconComponent } from '../../shared/components/icon/icon.component';

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
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
            <span class="nav-icon">
              <app-icon [name]="item.icon" [size]="18"></app-icon>
            </span>
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
    .nav-icon { display: inline-flex; align-items: center; }
  `]
})
export class SidebarComponent {
  public readonly authStore = inject(AuthStore);

  public readonly menuItems: MenuItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { title: 'Store Requisitions', path: '/store-requisitions', icon: 'file-text' },
    { title: 'Purchase Requisitions', path: '/purchase-requisitions', icon: 'shopping-cart' },
    { title: 'Receiving Management', path: '/receiving', icon: 'package', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'Quality Inspection', path: '/inspection', icon: 'search', roles: ['Inspector', 'PropertyAdmin'] },
    { title: 'Property Issuing', path: '/issuing', icon: 'ticket', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'My User Custody (UC)', path: '/user-custody', icon: 'user' },
    { title: 'Property Returns', path: '/property-returns', icon: 'rotate-ccw' },
    { title: 'Property Transfers', path: '/property-transfers', icon: 'arrow-left-right' },
    { title: 'Property Handovers', path: '/property-handovers', icon: 'handshake', roles: ['PropertyAdmin', 'DepartmentManager', 'Storekeeper'] },
    { title: 'Disposal Stock', path: '/disposals', icon: 'trash-2', roles: ['ComplianceOfficer', 'PropertyAdmin'] },
    { title: 'Annual Inventory', path: '/annual-inventory', icon: 'clipboard-list', roles: ['PropertyAdmin', 'Storekeeper', 'DepartmentManager'] },
    { title: 'Compliance Audit', path: '/compliance', icon: 'shield-check', roles: ['ComplianceOfficer', 'PropertyAdmin'] },
    { title: 'Stock Control & Ledger', path: '/stock-control/bin-card', icon: 'dashboard', roles: ['Storekeeper', 'PropertyAdmin'] },
    { title: 'Safety Boxes', path: '/safety-boxes', icon: 'lock', roles: ['PropertyAdmin', 'Storekeeper'] },
    { title: 'Master Data & Config', path: '/master-data/items', icon: 'settings', roles: ['PropertyAdmin', 'Storekeeper'] },
    { title: 'MIS Reports', path: '/reports/stock-summary', icon: 'bar-chart-3', roles: ['PropertyAdmin', 'DepartmentManager', 'ComplianceOfficer', 'ReportViewer', 'FinanceOfficer'] },
    { title: 'User Administration', path: '/admin/users', icon: 'users', roles: ['PropertyAdmin'] }
  ];
}
