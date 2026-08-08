import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService, LedgerEntry, PagedResult } from '../../core/services/stock-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';

@Component({
  selector: 'app-bin-card-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, EthiopianDatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Bin Card / Stock Ledger</h2>
          <p class="subtitle">Track every stock transaction — receipts, issues, adjustments, returns</p>
        </div>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="itemFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Items</option>
          <option *ngFor="let it of items" [value]="it.id">{{ it.sku }} — {{ it.itemName }}</option>
        </select>
        <input type="date" [(ngModel)]="fromFilter" (ngModelChange)="loadData()" class="filter-select" />
        <input type="date" [(ngModel)]="toFilter" (ngModelChange)="loadData()" class="filter-select" />
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
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .positive { color: var(--ecx-success); font-weight: 600; }
    .negative { color: var(--ecx-danger); font-weight: 600; }
  `]
})
export class BinCardViewComponent implements OnInit {
  private readonly api = inject(StockApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly notify = inject(NotificationService);

  rows: LedgerEntry[] = [];
  loading = false;
  pageNumber = 1; pageSize = 50; totalCount = 0;
  itemFilter = ''; fromFilter = ''; toFilter = '';
  items: { id: string; sku: string; itemName: string }[] = [];

  readonly columns: ColumnDef<LedgerEntry>[] = [
    { key: 'itemName', header: 'Item', sortable: true },
    { key: 'transactionType', header: 'Type' },
    { key: 'documentType', header: 'Document' },
    { key: 'referenceNumber', header: 'Reference #' },
    { key: 'quantityChange', header: 'Qty Change', sortable: true },
    { key: 'balanceAfter', header: 'Balance After', sortable: true },
    { key: 'unitCost', header: 'Unit Cost' },
    { key: 'reason', header: 'Reason' },
    { key: 'transactionDate', header: 'Date', sortable: true }
  ];

  ngOnInit(): void {
    this.masterApi.searchItems().subscribe({ next: (i) => this.items = i.map(x => ({ id: x.id, sku: x.sku, itemName: x.itemName })) });
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.api.getLedger(this.pageNumber, this.pageSize, this.itemFilter || undefined, this.fromFilter || undefined, this.toFilter || undefined).subscribe({
      next: (r: PagedResult<LedgerEntry>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load bin card data'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
}
