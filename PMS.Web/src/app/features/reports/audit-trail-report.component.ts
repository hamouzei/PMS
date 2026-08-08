import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsApiService, PagedResult } from '../../core/services/reports-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuditTrailReportRow } from '../../core/models/reports.model';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';

@Component({
  selector: 'app-audit-trail-report',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, EthiopianDatePipe],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Audit Trail Report</h2>
          <p class="subtitle">Track all system actions with user, entity, and date filters</p>
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
          <label>Entity</label>
          <select [(ngModel)]="entityName" (ngModelChange)="loadData()" class="filter-input">
            <option value="">All Entities</option>
            <option *ngFor="let e of entityOptions" [value]="e">{{ e }}</option>
          </select>
        </div>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'actionDate'">{{ row.actionDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'action'" class="action-badge" [attr.data-action]="row.action">{{ row.action }}</span>
            <span *ngSwitchCase="'details'" class="details-text">{{ (row.details || '—') | slice:0:80 }}{{ (row.details?.length || 0) > 80 ? '…' : '' }}</span>
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
    .action-badge { font-size: 0.75rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: var(--radius-sm); background: var(--bg-app); border: 1px solid var(--border-color); }
    .details-text { font-size: 0.8125rem; color: var(--text-secondary); }
  `]
})
export class AuditTrailReportComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly notify = inject(NotificationService);

  rows: AuditTrailReportRow[] = [];
  loading = false;
  pageNumber = 1; pageSize = 50; totalCount = 0;
  fromDate = '';
  toDate = '';
  entityName = '';

  readonly entityOptions = [
    'ReceivingNote', 'ServiceRequest', 'PurchaseRequest', 'StoreIssueVoucher',
    'PropertyReturn', 'PropertyTransfer', 'PropertyHandover', 'DisposalRecord',
    'AnnualInventory', 'ComplianceRecord', 'InventoryStock', 'UserCustody'
  ];

  readonly columns: ColumnDef<AuditTrailReportRow>[] = [
    { key: 'actionDate', header: 'Date', sortable: true },
    { key: 'userName', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'entityName', header: 'Entity' },
    { key: 'entityId', header: 'Entity ID' },
    { key: 'details', header: 'Details' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getAuditTrail(
      this.pageNumber, this.pageSize,
      this.fromDate || undefined, this.toDate || undefined,
      this.entityName || undefined
    ).subscribe({
      next: (r: PagedResult<AuditTrailReportRow>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load audit trail'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
}
