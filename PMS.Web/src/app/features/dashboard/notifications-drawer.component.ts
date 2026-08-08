import { Component, OnInit, OnDestroy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, timer } from 'rxjs';
import { ReportsApiService } from '../../core/services/reports-api.service';
import { AuthStore } from '../../core/auth/auth.store';
import { NotificationEventDto } from '../../core/models/reports.model';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-notifications-drawer',
  standalone: true,
  imports: [CommonModule, EthiopianDatePipe, IconComponent],
  template: `
    <div class="drawer-backdrop" (click)="close()">
      <div class="drawer-panel" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <h3 class="drawer-title">
            <app-icon name="bell" [size]="20"></app-icon> Notifications
          </h3>
          <div class="drawer-header-actions">
            <button class="filter-btn" [class.active]="unreadOnly" (click)="toggleUnreadOnly()">
              Unread Only
            </button>
            <button class="close-btn" (click)="close()">&times;</button>
          </div>
        </div>
        <div class="drawer-body">
          <div *ngIf="loading" class="loading-state">
            <div class="spinner"></div> Loading notifications...
          </div>
          <div *ngIf="!loading && notifications.length === 0" class="empty-state">
            <app-icon name="check-circle" [size]="36" class="empty-icon"></app-icon>
            <p>No {{ unreadOnly ? 'unread ' : '' }}notifications</p>
          </div>
          <div *ngFor="let n of notifications" class="notification-item" [class.unread]="!n.isRead" (click)="markRead(n)">
            <div class="notif-header">
              <strong>{{ n.title }}</strong>
              <span class="notif-date">{{ n.createdDate | ethiopianDate }}</span>
            </div>
            <p class="notif-message">{{ n.message }}</p>
            <span *ngIf="n.referenceNumber" class="notif-ref">
              <app-icon name="paperclip" [size]="14"></app-icon> {{ n.referenceNumber }}
            </span>
          </div>
          <button *ngIf="hasMore" class="load-more-btn" (click)="loadMore()">Load More</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drawer-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 1100; display: flex; justify-content: flex-end; }
    .drawer-panel { background: var(--bg-surface); width: 400px; max-width: 100vw; height: 100%; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; animation: slide-in 0.25s ease-out; }
    @keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .drawer-header-actions { display: flex; align-items: center; gap: 0.5rem; }
    .filter-btn { font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--bg-app); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; color: var(--text-secondary); &.active { background: var(--ecx-navy-primary); color: white; border-color: var(--ecx-navy-primary); } }
    .close-btn { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .drawer-body { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
    .notification-item { padding: 0.75rem 1.25rem; cursor: pointer; transition: background 0.15s; border-bottom: 1px solid var(--border-color); &:hover { background: var(--bg-surface-hover); } &.unread { background: rgba(212, 175, 55, 0.05); border-left: 3px solid var(--ecx-gold-primary); } }
    .notif-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem; strong { font-size: 0.875rem; } }
    .notif-date { font-size: 0.6875rem; color: var(--text-muted); white-space: nowrap; }
    .notif-message { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.4; margin: 0; }
    .notif-ref { font-size: 0.75rem; color: var(--ecx-info); display: inline-block; margin-top: 0.25rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem 1.25rem; color: var(--text-muted); font-size: 0.875rem; }
    .spinner { width: 16px; height: 16px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 3rem 1rem; color: var(--text-muted); }
    .empty-icon { font-size: 2rem; }
    .load-more-btn { width: 100%; padding: 0.75rem; font-size: 0.8125rem; color: var(--ecx-info); background: none; border: none; border-top: 1px solid var(--border-color); cursor: pointer; &:hover { background: var(--bg-surface-hover); } }
  `]
})
export class NotificationsDrawerComponent implements OnInit, OnDestroy {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly authStore = inject(AuthStore);
  private readonly destroy$ = new Subject<void>();

  closed = output<void>();
  unreadCount = output<number>();

  notifications: NotificationEventDto[] = [];
  loading = true;
  unreadOnly = false;
  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;

  get hasMore(): boolean { return this.notifications.length < this.totalCount; }

  ngOnInit(): void {
    this.loadNotifications();
    // Poll every 60 seconds for new notifications
    timer(60_000, 60_000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refreshUnreadCount());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.loading = true;
    const userId = this.authStore.user()?.id;
    this.reportsApi.getNotifications(this.pageNumber, this.pageSize, userId, undefined, this.unreadOnly || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.notifications = this.pageNumber === 1 ? r.items : [...this.notifications, ...r.items];
          this.totalCount = r.totalCount;
          this.loading = false;
          this.emitUnreadCount();
        },
        error: () => { this.loading = false; }
      });
  }

  toggleUnreadOnly(): void {
    this.unreadOnly = !this.unreadOnly;
    this.pageNumber = 1;
    this.loadNotifications();
  }

  loadMore(): void {
    this.pageNumber++;
    this.loadNotifications();
  }

  markRead(n: NotificationEventDto): void {
    if (n.isRead) return;
    this.reportsApi.markNotificationRead(n.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { n.isRead = true; n.readAt = new Date().toISOString(); this.emitUnreadCount(); }
      });
  }

  private emitUnreadCount(): void {
    const count = this.notifications.filter(n => !n.isRead).length;
    this.unreadCount.emit(count);
  }

  private refreshUnreadCount(): void {
    const userId = this.authStore.user()?.id;
    this.reportsApi.getNotifications(1, 1, userId, undefined, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => this.unreadCount.emit(r.totalCount)
      });
  }

  close(): void { this.closed.emit(); }
}
