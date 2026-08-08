import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService, LowStockItem } from '../../core/services/stock-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule, DataTableComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2><app-icon name="alert-triangle" [size]="24" class="header-alert-icon"></app-icon> Low Stock Alerts</h2>
          <p class="subtitle">Items below their minimum stock level that need replenishment</p>
        </div>
      </div>

      <div class="alert-banner" *ngIf="!loading && rows.length > 0">
        <strong>{{ rows.length }}</strong> item(s) are below minimum stock level
      </div>
      <div class="no-alerts" *ngIf="!loading && rows.length === 0">
        <app-icon name="check-circle" [size]="20"></app-icon> All items are above their minimum stock levels
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="1" [pageSize]="rows.length || 1" [totalCount]="rows.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'availableQuantity'" class="low-qty">{{ row.availableQuantity }}</span>
            <span *ngSwitchCase="'minStockLevel'" class="min-level">{{ row.minStockLevel }}</span>
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
    .alert-banner { padding: 0.75rem 1rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: var(--radius-md); color: var(--ecx-warning); font-size: 0.875rem; }
    .no-alerts { padding: 1.5rem; text-align: center; color: var(--ecx-success); font-size: 1rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .low-qty { color: var(--ecx-danger); font-weight: 700; }
    .min-level { color: var(--text-secondary); font-weight: 500; }
  `]
})
export class LowStockAlertsComponent implements OnInit {
  private readonly api = inject(StockApiService);
  private readonly notify = inject(NotificationService);

  rows: LowStockItem[] = [];
  loading = false;

  readonly columns: ColumnDef<LowStockItem>[] = [
    { key: 'itemName', header: 'Item', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'currentQuantity', header: 'Current Qty' },
    { key: 'reservedQuantity', header: 'Reserved' },
    { key: 'availableQuantity', header: 'Available', sortable: true },
    { key: 'minStockLevel', header: 'Min Level' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getLowStock().subscribe({
      next: (r) => { this.rows = r; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load low stock alerts'); this.loading = false; }
    });
  }
}
