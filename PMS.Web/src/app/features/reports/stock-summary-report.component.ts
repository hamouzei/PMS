import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsApiService } from '../../core/services/reports-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { StockSummaryReportRow } from '../../core/models/reports.model';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-stock-summary-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Stock Summary Report</h2>
          <p class="subtitle">Aggregated inventory balances by item — current, reserved, and available quantities</p>
        </div>
      </div>

      <div class="filter-bar">
        <input [(ngModel)]="searchTerm" (ngModelChange)="applyFilter()" class="filter-input" placeholder="Search by SKU or item name..." />
        <label class="filter-check">
          <input type="checkbox" [(ngModel)]="showLowOnly" (ngModelChange)="applyFilter()" />
          Low stock only
        </label>
      </div>

      <div class="summary-bar" *ngIf="!loading">
        <span class="summary-item"><strong>{{ allRows.length }}</strong> items</span>
        <span class="summary-item"><strong>{{ lowStockCount }}</strong> below min level</span>
        <span class="summary-item">Total available: <strong>{{ totalAvailable | number }}</strong></span>
      </div>

      <app-data-table [columns]="columns" [data]="filteredRows" [loading]="loading"
        [currentPage]="1" [pageSize]="filteredRows.length" [totalCount]="filteredRows.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'availableQuantity'" [class.low-stock]="row.availableQuantity <= row.minStockLevel">
              {{ row.availableQuantity | number }}
            </span>
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
    .filter-bar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
    .filter-input { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); min-width: 260px; }
    .filter-check { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer; }
    .summary-bar { display: flex; gap: 1.5rem; padding: 0.75rem 1rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
    .summary-item { font-size: 0.8125rem; color: var(--text-secondary); strong { color: var(--text-primary); } }
    .low-stock { color: var(--ecx-danger); font-weight: 600; }
  `]
})
export class StockSummaryReportComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly notify = inject(NotificationService);

  allRows: StockSummaryReportRow[] = [];
  filteredRows: StockSummaryReportRow[] = [];
  loading = true;
  searchTerm = '';
  showLowOnly = false;

  readonly columns: ColumnDef<StockSummaryReportRow>[] = [
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'itemName', header: 'Item Name', sortable: true },
    { key: 'unitOfMeasure', header: 'UOM' },
    { key: 'currentQuantity', header: 'Current Qty', sortable: true },
    { key: 'reservedQuantity', header: 'Reserved' },
    { key: 'availableQuantity', header: 'Available', sortable: true },
    { key: 'minStockLevel', header: 'Min Level' }
  ];

  get lowStockCount(): number { return this.allRows.filter(r => r.availableQuantity <= r.minStockLevel).length; }
  get totalAvailable(): number { return this.allRows.reduce((s, r) => s + r.availableQuantity, 0); }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getStockSummary().subscribe({
      next: (rows) => { this.allRows = rows; this.applyFilter(); this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load stock summary'); this.loading = false; }
    });
  }

  applyFilter(): void {
    let rows = this.allRows;
    if (this.showLowOnly) rows = rows.filter(r => r.availableQuantity <= r.minStockLevel);
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      rows = rows.filter(r => r.sku.toLowerCase().includes(term) || r.itemName.toLowerCase().includes(term));
    }
    this.filteredRows = rows;
  }
}
