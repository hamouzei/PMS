import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequisitionApiService } from '../../core/services/requisition-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ServiceRequest, WorkflowStatus } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-store-request-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="file-text" [size]="20"></app-icon> Store Request — {{ detail?.srNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">SR #</span><span>{{ detail.srNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">Requester</span><span>{{ detail.requester?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span>{{ detail.requestDate | ethiopianDate }}</span></div>
            <div class="meta-item"><span class="meta-label">Reason</span><span>{{ detail.reason || '—' }}</span></div>
          </div>

          <h4 class="section-title">Requested Items</h4>
          <table class="detail-table">
            <thead><tr><th>Item</th><th>Requested</th><th>Approved</th><th>Issued</th><th>Remarks</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detail.details">
                <td>{{ d.item?.itemName || d.itemId }}</td>
                <td>{{ d.requestedQty }}</td>
                <td>{{ d.approvedQty }}</td>
                <td>{{ d.issuedQty }}</td>
                <td>{{ d.remarks || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Approve / Reject Section -->
          <div *ngIf="canApprove" class="action-section">
            <h4 class="section-title">Approval Decision</h4>
            <div class="form-group">
              <label>Remark</label>
              <input [(ngModel)]="remark" class="form-control" placeholder="Optional remark" />
            </div>
            <div class="action-row">
              <app-button variant="gold" (btnClick)="approve()" [loading]="approving">
                <span><app-icon name="check-circle" [size]="16"></app-icon> Approve</span>
              </app-button>
              <app-button variant="danger" (btnClick)="showRejectForm = true" *ngIf="!showRejectForm">
                <span><app-icon name="x-circle" [size]="16"></app-icon> Reject</span>
              </app-button>
            </div>
            <div *ngIf="showRejectForm" class="reject-form">
              <div class="form-group">
                <label>Rejection Reason *</label>
                <textarea [(ngModel)]="rejectReason" class="form-control" rows="2"></textarea>
              </div>
              <app-button variant="danger" (btnClick)="reject()" [loading]="rejecting" [disabled]="!rejectReason">
                <span><app-icon name="x-circle" [size]="16"></app-icon> Confirm Rejection</span>
              </app-button>
            </div>
          </div>
        </div>
        <ng-template #loadingTpl>
          <div class="loading-state"><div class="spinner"></div> Loading...</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; overflow-y: auto; max-height: 90vh; }
    .modal-lg { max-width: 800px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 1rem; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } }
    .action-section { margin-top: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .action-row { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
    .reject-form { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StoreRequestDetailModalComponent implements OnInit {
  private readonly api = inject(RequisitionApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  requestId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: ServiceRequest | null = null;
  approving = false; rejecting = false;
  remark = ''; rejectReason = '';
  showRejectForm = false;

  get canApprove(): boolean {
    return !!this.detail && this.detail.status === WorkflowStatus.PendingApproval
      && this.authStore.hasRole(['PropertyAdmin', 'Storekeeper', 'DepartmentManager']);
  }

  ngOnInit(): void {
    this.api.getStoreRequestById(this.requestId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load store request details')
    });
  }

  approve(): void {
    this.approving = true;
    this.api.approveStoreRequest(this.requestId(), {
      actorId: this.authStore.user()?.id || '', remark: this.remark || undefined
    }).subscribe({
      next: () => { this.approving = false; this.notify.success('Success', 'Store request approved'); this.updated.emit(); this.closed.emit(); },
      error: () => { this.approving = false; this.notify.error('Error', 'Failed to approve store request'); }
    });
  }

  reject(): void {
    if (!this.rejectReason) return;
    this.rejecting = true;
    this.api.rejectStoreRequest(this.requestId(), {
      actorId: this.authStore.user()?.id || '', reason: this.rejectReason
    }).subscribe({
      next: () => { this.rejecting = false; this.notify.success('Success', 'Store request rejected'); this.updated.emit(); this.closed.emit(); },
      error: () => { this.rejecting = false; this.notify.error('Error', 'Failed to reject store request'); }
    });
  }

  close(): void { this.closed.emit(); }
}
