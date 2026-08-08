import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustodyApiService, ApprovePayload } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { PropertyHandover, WorkflowStatus } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-handover-detail-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="handshake" [size]="20"></app-icon> Handover Detail — {{ detail?.handoverNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">Handover From</span><span>{{ detail.handoverFrom?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Handover To</span><span>{{ detail.handoverTo?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">From Location</span><span>{{ detail.fromLocation || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">To Location</span><span>{{ detail.toLocation || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Purpose</span><span>{{ detail.purpose || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span>{{ detail.handoverDate | ethiopianDate }}</span></div>
            <div class="meta-item" *ngIf="detail.remarks"><span class="meta-label">Remarks</span><span>{{ detail.remarks }}</span></div>
            <div class="meta-item" *ngIf="detail.authorizedBy">
              <span class="meta-label">Authorized By</span><span>{{ detail.authorizedBy.fullName }}</span>
            </div>
          </div>

          <h4 class="section-title">Handover Line Items</h4>
          <table class="detail-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Tag #</th><th>Serial #</th><th>FARN #</th><th>RMRN #</th><th>FAIV #</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detail.details">
                <td>{{ d.item?.itemName || '—' }}</td>
                <td>{{ d.quantity }}</td>
                <td>{{ d.tagNumber || '—' }}</td>
                <td>{{ d.serialNumber || '—' }}</td>
                <td>{{ d.farnNumber || '—' }}</td>
                <td>{{ d.rmrnNumber || '—' }}</td>
                <td>{{ d.faivNumber || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="modal-footer" *ngIf="canApprove">
            <app-button variant="gold" (btnClick)="approve()" [loading]="approving">
              <span><app-icon name="check-circle" [size]="16"></app-icon> Approve Handover</span>
            </app-button>
          </div>
        </div>

        <ng-template #loadingTpl>
          <div class="loading-state"><div class="spinner"></div> Loading details...</div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; overflow-y: auto; max-height: 90vh; }
    .modal-lg { max-width: 900px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color); margin-top: 1rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; overflow-x: auto; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; white-space: nowrap; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class HandoverDetailModalComponent implements OnInit {
  private readonly api = inject(CustodyApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  handoverId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: PropertyHandover | null = null;
  approving = false;

  get canApprove(): boolean {
    if (!this.detail) return false;
    return (this.detail.status === WorkflowStatus.PendingApproval || this.detail.status === WorkflowStatus.Submitted)
      && this.authStore.hasRole(['PropertyAdmin', 'DepartmentManager']);
  }

  ngOnInit(): void {
    this.api.getHandoverById(this.handoverId()).subscribe({
      next: (h) => this.detail = h,
      error: () => this.notify.error('Error', 'Failed to load handover details')
    });
  }

  approve(): void {
    this.approving = true;
    const user = this.authStore.user();
    const payload: ApprovePayload = { actorId: user?.id || '' };
    this.api.approveHandover(this.handoverId(), payload).subscribe({
      next: () => {
        this.approving = false;
        this.notify.success('Success', 'Handover approved');
        this.updated.emit();
        this.closed.emit();
      },
      error: () => { this.approving = false; this.notify.error('Error', 'Failed to approve handover'); }
    });
  }

  close(): void { this.closed.emit(); }
}
