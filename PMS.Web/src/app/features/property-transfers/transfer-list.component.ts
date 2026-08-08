import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustodyApiService, TransferSummary, PagedResult } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { TransferFormModalComponent } from './transfer-form-modal.component';
import { TransferDetailModalComponent } from './transfer-detail-modal.component';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, TransferFormModalComponent, TransferDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Property Transfers (RMTN)</h2>
          <p class="subtitle">Transfer custody of assets between staff members — requires authorization</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span>🔄 New Transfer</span>
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
        [data]="transfers"
        [loading]="loading"
        [currentPage]="pageNumber"
        [pageSize]="pageSize"
        [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">

        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'transferDate'">{{ row.transferDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'rmtnNumber'">
              <a class="link" (click)="openDetail(row)">{{ row.rmtnNumber }}</a>
            </span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>

        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-transfer-form-modal
        *ngIf="showCreateModal"
        (closed)="showCreateModal = false"
        (saved)="onSaved()">
      </app-transfer-form-modal>

      <app-transfer-detail-modal
        *ngIf="showDetailModal && selectedId"
        [transferId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null"
        (updated)="loadData()">
      </app-transfer-detail-modal>
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
export class TransferListComponent implements OnInit {
  private readonly api = inject(CustodyApiService);
  private readonly notify = inject(NotificationService);

  transfers: TransferSummary[] = [];
  loading = false;
  pageNumber = 1;
  pageSize = 20;
  totalCount = 0;
  statusFilter = '';

  showCreateModal = false;
  showDetailModal = false;
  selectedId: string | null = null;

  readonly columns: ColumnDef<TransferSummary>[] = [
    { key: 'rmtnNumber', header: 'RMTN #', sortable: true },
    { key: 'fromCustodian', header: 'From' },
    { key: 'toCustodian', header: 'To' },
    { key: 'reason', header: 'Reason' },
    { key: 'transferDate', header: 'Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getTransfers(this.pageNumber, this.pageSize, this.statusFilter || undefined).subscribe({
      next: (result: PagedResult<TransferSummary>) => {
        this.transfers = result.items;
        this.totalCount = result.totalCount;
        this.loading = false;
      },
      error: () => { this.notify.error('Error', 'Failed to load transfers'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: TransferSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Property Transfer created'); }
}
