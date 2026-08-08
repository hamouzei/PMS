import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { AuthService } from '../../core/auth/auth.service';
import { EthiopianCalendarService } from '../../core/services/ethiopian-calendar.service';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <span class="brand-title">ECX Property Automation</span>
        <span class="efy-badge">EFY {{ currentFiscalYear() }}</span>
      </div>

      <div class="topbar-right">
        <button type="button" class="icon-btn" (click)="themeService.toggleTheme()" title="Toggle Theme">
          <app-icon [name]="currentTheme() === 'light' ? 'moon' : 'sun'" [size]="18"></app-icon>
        </button>

        <div *ngIf="user()" class="user-profile">
          <div class="user-avatar">{{ user()?.fullName?.charAt(0) || 'U' }}</div>
          <div class="user-info">
            <span class="user-name">{{ user()?.fullName }}</span>
            <span class="user-role">{{ roleName() }}</span>
          </div>
          <button type="button" class="logout-btn" (click)="authService.logout()" title="Sign Out">
            <app-icon name="log-out" [size]="18"></app-icon>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 64px;
      background-color: var(--bg-topbar);
      border-bottom: 1px solid var(--border-color);
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky; top: 0; z-index: 100;
    }
    .topbar-left { display: flex; align-items: center; gap: 0.75rem; }
    .brand-title { font-size: 1.125rem; font-weight: 700; color: var(--brand-header-text); }
    .efy-badge {
      font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem;
      background-color: var(--ecx-gold-primary); color: #0F172A;
      border-radius: var(--radius-sm);
    }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }
    .icon-btn {
      padding: 0.5rem; border-radius: 50%;
      &:hover { background-color: var(--bg-surface-hover); }
    }
    .user-profile { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background-color: var(--ecx-navy-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.875rem;
    }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
    .user-role { font-size: 0.75rem; color: var(--text-secondary); }
    .logout-btn { padding: 0.5rem; border-radius: var(--radius-sm); &:hover { background-color: var(--ecx-danger-bg); } }
  `]
})
export class TopbarComponent {
  public readonly authStore = inject(AuthStore);
  public readonly authService = inject(AuthService);
  public readonly themeService = inject(ThemeService);
  public readonly ethCalendar = inject(EthiopianCalendarService);

  public readonly user = this.authStore.user;
  public readonly roleName = this.authStore.roleName;
  public readonly currentFiscalYear = this.ethCalendar.currentFiscalYear;
  public readonly currentTheme = this.themeService.currentTheme;
}
