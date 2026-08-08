import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustodyApiService, CustodyRecord, PagedResult } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-user-custody-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ButtonComponent, IconComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>My User Custody (UC)</h2>
          <p class="subtitle">Fixed assets and items currently assigned to you — includes tag numbers, serial numbers, and source document references</p>
        </div>
        <div class="toggle-row">
          <app-button
            [variant]="showAllCustody ? 'secondary' : 'gold'"
            (btnClick)="showAllCustody = false; loadData()">
            <span><app-icon name="user" [size]="16"></app-icon> My Custody</span>
          </app-button>
          <app-button
            *ngIf="authStore.hasRole(['PropertyAdmin', 'Storekeeper'])"
            [variant]="showAllCustody ? 'gold' : 'secondary'"
            (btnClick)="showAllCustody = true; loadData()">
            <span><app-icon name="clipboard-list" [size]="16"></app-icon> All Custody Records</span>
          </app-button>
        </div>
      </div>

      <div class="summary-cards" *ngIf="!loading">
        <div class="summary-card">
          <span class="card-number">{{ records.length }}</span>
          <span class="card-label">Items in Custody</span>
        </div>
        <div class="summary-card">
          <span class="card-number">{{ totalQuantity }}</span>
          <span class="card-label">Total Quantity</span>
        </div>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="records"
        [loading]="loading"
        [currentPage]="pageNumber"
        [pageSize]="pageSize"
        [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">

        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'tagNumber'" class="tag-badge">{{ row.tagNumber || '—' }}</span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;
    }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .toggle-row { display: flex; gap: 0.5rem; }
    .summary-cards { display: flex; gap: 1rem; flex-wrap: wrap; }
    .summary-card {
      padding: 1rem 1.5rem; background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 0.25rem;
      min-width: 140px;
    }
    .card-number { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
    .card-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .tag-badge {
      font-family: 'Courier New', monospace; font-size: 0.8125rem; font-weight: 600;
      padding: 0.125rem 0.5rem; background: var(--bg-app); border-radius: var(--radius-sm);
      color: var(--icon-accent); border: 1px solid var(--border-color);
    }
  `]
})
export class UserCustodyListComponent implements OnInit {
  private readonly api = inject(CustodyApiService);
  public readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  records: CustodyRecord[] = [];
  loading = false;
  pageNumber = 1;
  pageSize = 50;
  totalCount = 0;
  showAllCustody = false;

  readonly columns: ColumnDef<CustodyRecord>[] = [
    { key: 'itemName', header: 'Item', sortable: true },
    { key: 'tagNumber', header: 'Tag Number' },
    { key: 'serialNumber', header: 'Serial Number' },
    { key: 'quantity', header: 'Qty', sortable: true },
    { key: 'custodian', header: 'Custodian' },
    { key: 'sourceDocumentNumber', header: 'Source Document' }
  ];

  get totalQuantity(): number {
    return this.records.reduce((sum, r) => sum + r.quantity, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const custodianId = this.showAllCustody ? undefined : this.authStore.user()?.id;
    this.api.getCustodyRecords(this.pageNumber, this.pageSize, custodianId).subscribe({
      next: (result: PagedResult<CustodyRecord>) => {
        this.records = result.items;
        this.totalCount = result.totalCount;
        this.loading = false;
      },
      error: () => {
        this.notify.error('Error', 'Failed to load custody records');
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.pageNumber = page;
    this.loadData();
  }
}
