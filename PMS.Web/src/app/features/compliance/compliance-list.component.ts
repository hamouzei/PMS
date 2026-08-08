import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceApiService, ComplianceSummary, PagedResult } from '../../core/services/compliance-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ComplianceFormModalComponent } from './compliance-form-modal.component';
import { ComplianceDetailModalComponent } from './compliance-detail-modal.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-compliance-list',
  standalone: true,
  imports: [
    CommonModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, ComplianceFormModalComponent, ComplianceDetailModalComponent,
    IconComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Compliance Audit</h2>
          <p class="subtitle">Record findings, recommendations, and corrective actions linked to annual inventories</p>
        </div>
        <app-button variant="gold" (btnClick)="showCreateModal = true">
          <span><app-icon name="plus" [size]="16"></app-icon> New Compliance Record</span>
        </app-button>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'reviewDate'">{{ row.reviewDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'complianceNumber'"><a class="link" (click)="openDetail(row)">{{ row.complianceNumber }}</a></span>
            <span *ngSwitchCase="'findings'">{{ (row.findings || '—') | slice:0:60 }}{{ (row.findings?.length || 0) > 60 ? '…' : '' }}</span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">
            <app-icon name="eye" [size]="16"></app-icon>
          </button>
        </ng-template>
      </app-data-table>

      <app-compliance-form-modal *ngIf="showCreateModal"
        (closed)="showCreateModal = false" (saved)="onSaved()">
      </app-compliance-form-modal>

      <app-compliance-detail-modal *ngIf="showDetailModal && selectedId"
        [complianceId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null" (updated)="loadData()">
      </app-compliance-detail-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .link { color: var(--ecx-info); cursor: pointer; text-decoration: underline; }
    .action-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); &:hover { background-color: var(--bg-surface-hover); } }
  `]
})
export class ComplianceListComponent implements OnInit {
  private readonly api = inject(ComplianceApiService);
  private readonly notify = inject(NotificationService);

  rows: ComplianceSummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  showCreateModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<ComplianceSummary>[] = [
    { key: 'complianceNumber', header: 'Compliance #', sortable: true },
    { key: 'inventoryNumber', header: 'Inventory #' },
    { key: 'reviewedBy', header: 'Reviewed By' },
    { key: 'findings', header: 'Findings' },
    { key: 'reviewDate', header: 'Review Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getRecords(this.pageNumber, this.pageSize).subscribe({
      next: (r: PagedResult<ComplianceSummary>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load compliance records'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: ComplianceSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onSaved(): void { this.showCreateModal = false; this.loadData(); this.notify.success('Success', 'Compliance record created'); }
}
