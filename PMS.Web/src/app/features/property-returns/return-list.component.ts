import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustodyApiService, ReturnSummary, PagedResult } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ReturnFormModalComponent } from './return-form-modal.component';
import { ReturnDetailModalComponent } from './return-detail-modal.component';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, ReturnFormModalComponent, ReturnDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Property Returns (RMRN)</h2>
          <p class="subtitle">Return items from custody back to the store — storekeeper approves and restocks</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span>↩️ New Return</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="PendingApproval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="returns"
        [loading]="loading"
        [currentPage]="pageNumber"
        [pageSize]="pageSize"
        [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">

        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'returnDate'">{{ row.returnDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'rmrnNumber'">
              <a class="link" (click)="openDetail(row)">{{ row.rmrnNumber }}</a>
            </span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>

        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-return-form-modal
        *ngIf="showCreateModal"
        (closed)="showCreateModal = false"
        (saved)="onSaved()">
      </app-return-form-modal>

      <app-return-detail-modal
        *ngIf="showDetailModal && selectedId"
        [returnId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null"
        (updated)="loadData()">
      </app-return-detail-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
    .filter-select {
      padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md);
      font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary);
    }
    .link { color: var(--ecx-info); cursor: pointer; text-decoration: underline; }
    .action-btn {
      background: none; border: none; cursor: pointer; font-size: 1rem;
      padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);
      &:hover { background-color: var(--bg-surface-hover); }
    }
  `]
})
export class ReturnListComponent implements OnInit {
  private readonly api = inject(CustodyApiService);
  private readonly notify = inject(NotificationService);

  returns: ReturnSummary[] = [];
  loading = false;
  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;
  statusFilter = '';

  showCreateModal = false;
  showDetailModal = false;
  selectedId: string | null = null;

  readonly columns: ColumnDef<ReturnSummary>[] = [
    { key: 'rmrnNumber', header: 'RMRN #', sortable: true },
    { key: 'returnedBy', header: 'Returned By' },
    { key: 'reason', header: 'Reason' },
    { key: 'returnDate', header: 'Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getReturns(this.pageNumber, this.pageSize, this.statusFilter || undefined).subscribe({
      next: (result: PagedResult<ReturnSummary>) => {
        this.returns = result.items;
        this.totalCount = result.totalCount;
        this.loading = false;
      },
      error: () => { this.notify.error('Error', 'Failed to load returns'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: ReturnSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Property Return created'); }
}
