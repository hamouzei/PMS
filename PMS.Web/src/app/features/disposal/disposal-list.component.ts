import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisposalApiService, DisposalSummary, PagedResult } from '../../core/services/disposal-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DisposalFormModalComponent } from './disposal-form-modal.component';
import { DisposalDetailModalComponent } from './disposal-detail-modal.component';

@Component({
  selector: 'app-disposal-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, DisposalFormModalComponent, DisposalDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Stock Disposal</h2>
          <p class="subtitle">Request and track property disposal — Auction, Tendering, Scrapping</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span>🗑️ New Disposal Request</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          <option value="Disposed">Disposed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'disposalNumber'"><a class="link" (click)="openDetail(row)">{{ row.disposalNumber }}</a></span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-disposal-form-modal *ngIf="showCreateModal"
        (closed)="showCreateModal = false" (saved)="onSaved()">
      </app-disposal-form-modal>

      <app-disposal-detail-modal *ngIf="showDetailModal && selectedId"
        [disposalId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null" (updated)="loadData()">
      </app-disposal-detail-modal>
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
export class DisposalListComponent implements OnInit {
  private readonly api = inject(DisposalApiService);
  private readonly notify = inject(NotificationService);

  rows: DisposalSummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  statusFilter = '';
  showCreateModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<DisposalSummary>[] = [
    { key: 'disposalNumber', header: 'Disposal #', sortable: true },
    { key: 'itemName', header: 'Item' },
    { key: 'custodian', header: 'Custodian' },
    { key: 'quantity', header: 'Qty' },
    { key: 'condition', header: 'Condition' },
    { key: 'disposalMethod', header: 'Method' },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getDisposals(this.pageNumber, this.pageSize, this.statusFilter || undefined).subscribe({
      next: (r: PagedResult<DisposalSummary>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load disposal records'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: DisposalSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Disposal request created'); }
}
