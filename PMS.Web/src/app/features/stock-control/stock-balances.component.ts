import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockApiService, StockBalance, PagedResult } from '../../core/services/stock-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { OpeningBalanceModalComponent } from './opening-balance-modal.component';
import { StockAdjustmentModalComponent } from './stock-adjustment-modal.component';

@Component({
  selector: 'app-stock-balances',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, ButtonComponent, OpeningBalanceModalComponent, StockAdjustmentModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Stock Balances</h2>
          <p class="subtitle">Current inventory levels across warehouses</p>
        </div>
        <div class="header-actions">
          <app-button variant="secondary" (btnClick)="showOpeningModal = true"><span>📋 Opening Balance</span></app-button>
          <app-button variant="gold" (btnClick)="showAdjustModal = true"><span>⚖️ Stock Adjustment</span></app-button>
        </div>
      </div>

      <div class="filter-bar">
        <select [(ngModel)]="warehouseFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Warehouses</option>
          <option *ngFor="let w of warehouses" [value]="w.id">{{ w.warehouseName }}</option>
        </select>
        <select [(ngModel)]="propertyTypeFilter" (ngModelChange)="loadData()" class="filter-select">
          <option value="">All Types</option>
          <option value="Consumable">Consumable</option>
          <option value="FixedAsset">Fixed Asset</option>
        </select>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'availableQuantity'" [class.low-stock]="row.availableQuantity <= 5">
              {{ row.availableQuantity }}
            </span>
            <span *ngSwitchCase="'discrepancy'" [class.has-discrepancy]="row.discrepancy !== 0">
              {{ row.discrepancy }}
            </span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>

      <app-opening-balance-modal *ngIf="showOpeningModal"
        (closed)="showOpeningModal = false" (saved)="onBalanceSaved()">
      </app-opening-balance-modal>

      <app-stock-adjustment-modal *ngIf="showAdjustModal"
        (closed)="showAdjustModal = false" (saved)="onAdjustmentSaved()">
      </app-stock-adjustment-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .filter-select { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .low-stock { color: var(--ecx-danger); font-weight: 600; }
    .has-discrepancy { color: var(--ecx-warning); font-weight: 600; }
  `]
})
export class StockBalancesComponent implements OnInit {
  private readonly api = inject(StockApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly notify = inject(NotificationService);

  rows: StockBalance[] = [];
  loading = false;
  pageNumber = 1; pageSize = 50; totalCount = 0;
  warehouseFilter = ''; propertyTypeFilter = '';
  showOpeningModal = false; showAdjustModal = false;
  warehouses: { id: string; warehouseName: string }[] = [];

  readonly columns: ColumnDef<StockBalance>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'itemName', header: 'Item', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'shelfNumber', header: 'Shelf' },
    { key: 'currentQuantity', header: 'Current Qty', sortable: true },
    { key: 'reservedQuantity', header: 'Reserved' },
    { key: 'availableQuantity', header: 'Available', sortable: true },
    { key: 'discrepancy', header: 'Discrepancy' }
  ];

  ngOnInit(): void {
    this.masterApi.getWarehouses().subscribe({ next: (w) => this.warehouses = w.map(x => ({ id: x.id, warehouseName: x.warehouseName })) });
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.api.getBalances(this.pageNumber, this.pageSize, this.warehouseFilter || undefined, undefined, this.propertyTypeFilter || undefined).subscribe({
      next: (r: PagedResult<StockBalance>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load stock balances'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  onBalanceSaved(): void { this.showOpeningModal = false; this.loadData(); this.notify.success('Success', 'Opening balance registered'); }
  onAdjustmentSaved(): void { this.showAdjustModal = false; this.loadData(); this.notify.success('Success', 'Stock adjustment recorded'); }
}
