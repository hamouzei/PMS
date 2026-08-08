import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceivingApiService, ReceivingSummary, PagedResult } from '../../core/services/receiving-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ReceivingFormModalComponent } from './receiving-form-modal.component';
import { ReceivingDetailModalComponent } from './receiving-detail-modal.component';

@Component({
  selector: 'app-receiving-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, ReceivingFormModalComponent, ReceivingDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Receiving Management (GRN / FARN)</h2>
          <p class="subtitle">Record goods received from suppliers, inspect quality, and release to stock</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span>📦 New Receiving Note</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="statusFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Statuses</option>
          <option value="Received">Received</option>
          <option value="InspectionPending">Inspection Pending</option>
          <option value="InspectionPassed">Inspection Passed</option>
          <option value="InspectionFailed">Inspection Failed</option>
          <option value="Approved">Released to Stock</option>
        </select>
      </div>

      <app-data-table
        [columns]="columns" [data]="notes" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'receivedDate'">{{ row.receivedDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'grnNumber'">
              <a class="link" (click)="openDetail(row)">{{ row.grnNumber }}</a>
            </span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-receiving-form-modal *ngIf="showCreateModal"
        (closed)="showCreateModal = false" (saved)="onSaved()">
      </app-receiving-form-modal>

      <app-receiving-detail-modal *ngIf="showDetailModal && selectedId"
        [receivingId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null" (updated)="loadData()">
      </app-receiving-detail-modal>
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
export class ReceivingListComponent implements OnInit {
  private readonly api = inject(ReceivingApiService);
  private readonly notify = inject(NotificationService);

  notes: ReceivingSummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  statusFilter = '';
  showCreateModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<ReceivingSummary>[] = [
    { key: 'grnNumber', header: 'GRN #', sortable: true },
    { key: 'farnNumber', header: 'FARN #' },
    { key: 'supplier', header: 'Supplier' },
    { key: 'receivedBy', header: 'Received By' },
    { key: 'invoiceNumber', header: 'Invoice #' },
    { key: 'receivedDate', header: 'Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getReceivingNotes(this.pageNumber, this.pageSize, this.statusFilter || undefined).subscribe({
      next: (r: PagedResult<ReceivingSummary>) => { this.notes = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load receiving notes'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: ReceivingSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Receiving note created'); }
}
