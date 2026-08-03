import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FooterComponent } from '../footer/footer.component';
import { LoadingService } from '../../core/services/loading.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    TopbarComponent,
    SidebarComponent,
    BreadcrumbComponent,
    FooterComponent
  ],
  template: `
    <div class="layout-wrapper">
      <div *ngIf="loadingService.isLoading()" class="global-progress-bar">
        <div class="progress-indeterminate"></div>
      </div>

      <app-topbar></app-topbar>

      <div class="layout-body">
        <app-sidebar></app-sidebar>
        
        <main class="content-area">
          <app-breadcrumb></app-breadcrumb>
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-footer></app-footer>

      <!-- Global Toast Container -->
      <div class="toast-container">
        <div
          *ngFor="let toast of notificationService.toasts()"
          [class]="'toast toast-' + toast.type"
          (click)="notificationService.dismiss(toast.id)">
          <div class="toast-header">
            <strong class="toast-title">{{ toast.title }}</strong>
            <button type="button" class="toast-close">&times;</button>
          </div>
          <div class="toast-body">{{ toast.message }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex; flex-direction: column; min-height: 100vh;
      background-color: var(--bg-app); position: relative;
    }
    .global-progress-bar {
      position: fixed; top: 0; left: 0; right: 0; height: 3px;
      background-color: var(--ecx-gold-light); z-index: 1000; overflow: hidden;
    }
    .progress-indeterminate {
      height: 100%; background-color: var(--ecx-gold-primary);
      width: 40%; animation: loading 1.5s infinite ease-in-out;
    }
    @keyframes loading {
      0% { margin-left: -40%; width: 30%; }
      50% { margin-left: 40%; width: 60%; }
      100% { margin-left: 100%; width: 30%; }
    }
    .layout-body {
      display: flex; flex: 1; min-height: calc(100vh - 104px);
    }
    .content-area {
      flex: 1; padding: 1.5rem; overflow-y: auto; max-width: 1400px;
    }
    .toast-container {
      position: fixed; bottom: 1.5rem; right: 1.5rem;
      display: flex; flex-direction: column; gap: 0.75rem;
      z-index: 1100; max-width: 380px; width: 100%;
    }
    .toast {
      padding: 0.875rem 1rem; border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg); cursor: pointer; color: #fff;
      animation: slideIn 0.25s ease-out;
    }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .toast-success { background-color: var(--ecx-success); }
    .toast-error { background-color: var(--ecx-danger); }
    .toast-warning { background-color: var(--ecx-warning); color: #0F172A; }
    .toast-info { background-color: var(--ecx-navy-primary); }
    .toast-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .toast-title { font-size: 0.875rem; font-weight: 600; }
    .toast-close { color: inherit; font-size: 1.125rem; line-height: 1; }
    .toast-body { font-size: 0.8125rem; }
  `]
})
export class MainLayoutComponent {
  public readonly loadingService = inject(LoadingService);
  public readonly notificationService = inject(NotificationService);
}
