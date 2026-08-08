import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustodyApiService, ApprovePayload } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { PropertyReturn, WorkflowStatus, PROPERTY_CONDITION_LABELS } from '../../core/models/workflow.model';

@Component({
  selector: 'app-return-detail-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Return Detail — {{ detail?.rmrnNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>

        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">Returned By</span><span>{{ detail.returnedBy?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Return Date</span><span>{{ detail.returnDate | ethiopianDate }}</span></div>
            <div class="meta-item"><span class="meta-label">Reason</span><span>{{ detail.reason || '—' }}</span></div>
            <div class="meta-item" *ngIf="detail.authorizedBy">
              <span class="meta-label">Approved By</span><span>{{ detail.authorizedBy.fullName }}</span>
            </div>
          </div>

          <h4 class="section-title">Return Line Items</h4>
          <table class="detail-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Condition</th><th>Tag #</th><th>Serial #</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detail.details">
                <td>{{ d.item?.itemName || '—' }}</td>
                <td>{{ d.quantity }}</td>
                <td>{{ getConditionLabel(d.condition) }}</td>
                <td>{{ d.tagNumber || '—' }}</td>
                <td>{{ d.serialNumber || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div class="modal-footer" *ngIf="canApprove">
            <app-button variant="gold" (btnClick)="approve()" [loading]="approving">
              <span>✅ Approve Return & Restock</span>
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
    .modal-lg { max-width: 800px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color); margin-top: 1rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReturnDetailModalComponent implements OnInit {
  private readonly api = inject(CustodyApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  returnId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: PropertyReturn | null = null;
  approving = false;

  readonly conditionLabels = PROPERTY_CONDITION_LABELS;

  get canApprove(): boolean {
    if (!this.detail) return false;
    return (this.detail.status === WorkflowStatus.PendingApproval || this.detail.status === WorkflowStatus.Submitted)
      && this.authStore.hasRole(['PropertyAdmin', 'Storekeeper', 'DepartmentManager']);
  }

  ngOnInit(): void {
    this.api.getReturnById(this.returnId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load return details')
    });
  }

  getConditionLabel(condition: number): string {
    return this.conditionLabels[condition] || 'Unknown';
  }

  approve(): void {
    this.approving = true;
    const user = this.authStore.user();
    const payload: ApprovePayload = { actorId: user?.id || '' };
    this.api.approveReturn(this.returnId(), payload).subscribe({
      next: () => {
        this.approving = false;
        this.notify.success('Success', 'Return approved — items restocked');
        this.updated.emit();
        this.closed.emit();
      },
      error: () => { this.approving = false; this.notify.error('Error', 'Failed to approve return'); }
    });
  }

  close(): void { this.closed.emit(); }
}
