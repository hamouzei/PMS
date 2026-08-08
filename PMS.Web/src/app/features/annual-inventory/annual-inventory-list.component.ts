import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnualInventoryApiService, InventorySummary, PagedResult } from '../../core/services/annual-inventory-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { InventoryFormModalComponent } from './inventory-form-modal.component';
import { InventoryDetailModalComponent } from './inventory-detail-modal.component';

@Component({
  selector: 'app-annual-inventory-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, InventoryFormModalComponent, InventoryDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Annual Physical Inventory</h2>
          <p class="subtitle">Conduct and track annual stock counts with discrepancy analysis</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span>📊 New Inventory Count</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <input type="number" [(ngModel)]="fiscalYearFilter" (ngModelChange)="loadData()" class="filter-select" placeholder="Fiscal Year (EFY)" style="width: 160px;" />
        <input [(ngModel)]="locationFilter" (ngModelChange)="loadData()" class="filter-select" placeholder="Location" />
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'countDate'">{{ row.countDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'inventoryNumber'"><a class="link" (click)="openDetail(row)">{{ row.inventoryNumber }}</a></span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-inventory-form-modal *ngIf="showCreateModal"
        (closed)="showCreateModal = false" (saved)="onSaved()">
      </app-inventory-form-modal>

      <app-inventory-detail-modal *ngIf="showDetailModal && selectedId"
        [inventoryId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null" (updated)="loadData()">
      </app-inventory-detail-modal>
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
export class AnnualInventoryListComponent implements OnInit {
  private readonly api = inject(AnnualInventoryApiService);
  private readonly notify = inject(NotificationService);

  rows: InventorySummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  fiscalYearFilter: number | null = null;
  locationFilter = '';
  showCreateModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<InventorySummary>[] = [
    { key: 'inventoryNumber', header: 'Inventory #', sortable: true },
    { key: 'fiscalYear', header: 'Fiscal Year', sortable: true },
    { key: 'location', header: 'Location' },
    { key: 'countedBy', header: 'Counted By' },
    { key: 'countDate', header: 'Count Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getInventories(this.pageNumber, this.pageSize, this.fiscalYearFilter || undefined, this.locationFilter || undefined).subscribe({
      next: (r: PagedResult<InventorySummary>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load inventory records'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: InventorySummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Annual inventory created'); }
}
