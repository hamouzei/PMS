import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequisitionApiService, StoreRequestSummary, PagedResult } from '../../core/services/requisition-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { StoreRequestFormModalComponent } from './store-request-form-modal.component';
import { StoreRequestDetailModalComponent } from './store-request-detail-modal.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-store-request-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, StoreRequestFormModalComponent, StoreRequestDetailModalComponent,
    IconComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Store Requisitions (SR)</h2>
          <p class="subtitle">Request items from existing store stock</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span><app-icon name="plus" [size]="16"></app-icon> New Store Request</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Issued">Issued</option>
        </select>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'requestDate'">{{ row.requestDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'srNumber'"><a class="link" (click)="openDetail(row)">{{ row.srNumber }}</a></span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">
            <app-icon name="eye" [size]="16"></app-icon>
          </button>
        </ng-template>
      </app-data-table>

      <app-store-request-form-modal *ngIf="showCreateModal"
        (closed)="showCreateModal = false" (saved)="onSaved()">
      </app-store-request-form-modal>

      <app-store-request-detail-modal *ngIf="showDetailModal && selectedId"
        [requestId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null" (updated)="loadData()">
      </app-store-request-detail-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .link { color: var(--ecx-info); cursor: pointer; text-decoration: underline; }
    .action-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); &:hover { background-color: var(--bg-surface-hover); } }
  `]
})
export class StoreRequestListComponent implements OnInit {
  private readonly api = inject(RequisitionApiService);
  private readonly notify = inject(NotificationService);

  rows: StoreRequestSummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  statusFilter = '';
  showCreateModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<StoreRequestSummary>[] = [
    { key: 'srNumber', header: 'SR #', sortable: true },
    { key: 'requester', header: 'Requester' },
    { key: 'reason', header: 'Reason' },
    { key: 'detailCount', header: 'Items' },
    { key: 'requestDate', header: 'Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getStoreRequests(this.pageNumber, this.pageSize, this.statusFilter || undefined).subscribe({
      next: (r: PagedResult<StoreRequestSummary>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load store requests'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: StoreRequestSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Store requisition created'); }
}
