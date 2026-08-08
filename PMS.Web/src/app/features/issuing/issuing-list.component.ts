import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssuingApiService, VoucherSummary, PagedResult } from '../../core/services/issuing-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { IssuingModalComponent } from './issuing-modal.component';
import { IssuingDetailModalComponent } from './issuing-detail-modal.component';

@Component({
  selector: 'app-issuing-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DataTableComponent, StatusBadgeComponent,
    ButtonComponent, EthiopianDatePipe, IssuingModalComponent, IssuingDetailModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Property Issuing (SIV / FAIV)</h2>
          <p class="subtitle">Issue approved store requests to requesters</p>
        </div>
        <app-button variant="gold" (btnClick)="showIssueModal = true">
          <span>📦 Issue Stock</span>
        </app-button>
      </div>

      <app-data-table [columns]="columns" [data]="rows" [loading]="loading"
        [currentPage]="pageNumber" [pageSize]="pageSize" [totalCount]="totalCount"
        (pageChanged)="onPageChange($event)">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <app-status-badge *ngSwitchCase="'status'" [status]="row.status"></app-status-badge>
            <span *ngSwitchCase="'issueDate'">{{ row.issueDate | ethiopianDate }}</span>
            <span *ngSwitchCase="'sivNumber'"><a class="link" (click)="openDetail(row)">{{ row.sivNumber }}</a></span>
            <span *ngSwitchDefault>{{ row[key] ?? '—' }}</span>
          </ng-container>
        </ng-template>
        <ng-template #actionsTemplate let-row>
          <button class="action-btn" title="View" (click)="openDetail(row)">📋</button>
        </ng-template>
      </app-data-table>

      <app-issuing-modal *ngIf="showIssueModal"
        (closed)="showIssueModal = false" (saved)="onIssued()">
      </app-issuing-modal>

      <app-issuing-detail-modal *ngIf="showDetailModal && selectedId"
        [voucherId]="selectedId"
        (closed)="showDetailModal = false; selectedId = null">
      </app-issuing-detail-modal>
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
export class IssuingListComponent implements OnInit {
  private readonly api = inject(IssuingApiService);
  private readonly notify = inject(NotificationService);

  rows: VoucherSummary[] = [];
  loading = false;
  pageNumber = 1; pageSize = 20; totalCount = 0;
  showIssueModal = false; showDetailModal = false; selectedId: string | null = null;

  readonly columns: ColumnDef<VoucherSummary>[] = [
    { key: 'sivNumber', header: 'SIV #', sortable: true },
    { key: 'faivNumber', header: 'FAIV #' },
    { key: 'voucherType', header: 'Type' },
    { key: 'srNumber', header: 'SR #' },
    { key: 'issuedBy', header: 'Issued By' },
    { key: 'issueDate', header: 'Date', sortable: true },
    { key: 'status', header: 'Status' }
  ];

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.api.getVouchers(this.pageNumber, this.pageSize).subscribe({
      next: (r: PagedResult<VoucherSummary>) => { this.rows = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.notify.error('Error', 'Failed to load issue vouchers'); this.loading = false; }
    });
  }

  onPageChange(page: number): void { this.pageNumber = page; this.loadData(); }
  openDetail(row: VoucherSummary): void { this.selectedId = row.id; this.showDetailModal = true; }
  onIssued(): void { this.showIssueModal = false; this.loadData(); this.notify.success('Success', 'Stock issued successfully'); }
}
