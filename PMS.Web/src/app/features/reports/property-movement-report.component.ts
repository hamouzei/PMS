import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsApiService, PagedResult } from '../../core/services/reports-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { PropertyMovementReportRow } from '../../core/models/reports.model';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';

@Component({
  selector: 'app-property-movement-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, EthiopianDatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Property Movement Report</h2>
          <p class="subtitle">Stock ledger transactions with date range and transaction type filters</p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <label>From</label>
          <input type="date" [(ngModel)]="fromDate" (ngModelChange)="loadData()" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>To</label>
          <input type="date" [(ngModel)]="toDate" (ngModelChange)="loadData()" class="filter-input" />
        </div>
        <div class="filter-group">
          <label>Transaction Type</label>
          <select [(ngModel)]="transactionType" (ngModelChange)="loadData()" class="filter-input">
            <option value="">All Types</option>
            <option value="Receiving">Receiving</option>
            <option value="Issuing">Issuing</option>
            <option value="Return">Return</option>
            <option value="Adjustment">Adjustment</option>
            <option value="Disposal">Disposal</option>
            <option value="Transfer">Transfer</option>
            <option value="OpeningBalance">Opening Balance</option>
          </select>
        </div>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'transactionDate'">{{ row.transactionDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'quantityChange'" [class.positive]="row.quantityChange > 0" [class.negative]="row.quantityChange < 0">
              {{ row.quantityChange > 0 ? '+' : '' }}{{ row.quantityChange }}
            </span>
            <span *ngSwitchCase="'unitCost'">{{ row.unitCost ? (row.unitCost | number:'1.2-2') : '—' }}</span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 1rem; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; } }
    .filter-input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .positive { color: var(--ecx-success); font-weight: 600; }
    .negative { color: var(--ecx-danger); font-weight: 600; }
  `]
})
export class PropertyMovementReportComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly notify = inject(NotificationService);

  rows: PropertyMovementReportRow[] = [];
  loading = false;
  pageNumber = 1; pageSize = 50; totalCount = 0;
  fromDate = '';
  toDate = '';
  transactionType = '';

  readonly columns: ColumnDef<PropertyMovementReportRow>[] = [
    { key: 'transactionDate', header: 'Date', sortable: true },
    { key: 'itemName', header: 'Item' },
    { key: 'transactionType', header: 'Type' },
    { key: 'referenceNumber', header: 'Reference #' },
    { key: 'quantityChange', header: 'Qty Change', sortable: true },
    { key: 'balanceAfter', header: 'Balance After' },
    { key: 'unitCost', header: 'Unit Cost' },
    { key: 'reason', header: 'Reason' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getMovements(
      this.pageNumber, this.pageSize,
      this.fromDate || undefined, this.toDate || undefined,
      undefined, this.transactionType || undefined
    ).subscribe({
      next: (r: PagedResult<PropertyMovementReportRow>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load movement report'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
}
