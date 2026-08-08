import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisposalApiService } from '../../core/services/disposal-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DisposalRecord, WorkflowStatus, PROPERTY_CONDITION_LABELS } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

const DISPOSAL_METHOD_LABELS: Record<number, string> = { 1: 'Auction', 2: 'Tendering', 3: 'Scrapping', 4: 'Other' };

@Component({
  selector: 'app-disposal-detail-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="trash-2" [size]="20"></app-icon> Disposal — {{ detail?.disposalNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">Disposal #</span><span>{{ detail.disposalNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">Item</span><span>{{ detail.item?.itemName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Quantity</span><span>{{ detail.quantity }}</span></div>
            <div class="meta-item"><span class="meta-label">Condition</span><span>{{ conditionLabel(detail.condition) }}</span></div>
            <div class="meta-item"><span class="meta-label">Method</span><span>{{ methodLabel(detail.disposalMethod) }}</span></div>
            <div class="meta-item"><span class="meta-label">Custodian</span><span>{{ detail.custodian?.fullName || '—' }}</span></div>
            <div class="meta-item" *ngIf="detail.approvedBy"><span class="meta-label">Approved By</span><span>{{ detail.approvedBy.fullName }}</span></div>
          </div>
          <div *ngIf="detail.notes" class="notes-section">
            <strong>Notes:</strong> {{ detail.notes }}
          </div>

          <div *ngIf="canApprove" class="action-section">
            <h4 class="section-title">Approval</h4>
            <app-button variant="gold" (btnClick)="approve()" [loading]="approving">
              <span><app-icon name="check-circle" [size]="16"></app-icon> Approve Disposal</span>
            </app-button>
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
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 650px; overflow-y: auto; max-height: 90vh; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; }
    .notes-section { padding: 0.75rem 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.875rem; margin-bottom: 1rem; }
    .action-section { margin-top: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DisposalDetailModalComponent implements OnInit {
  private readonly api = inject(DisposalApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  disposalId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: DisposalRecord | null = null;
  approving = false;

  get canApprove(): boolean {
    return !!this.detail && this.detail.status === WorkflowStatus.Submitted
      && this.authStore.hasRole(['PropertyAdmin', 'ComplianceOfficer']);
  }

  conditionLabel(c: number): string { return PROPERTY_CONDITION_LABELS[c] || String(c); }
  methodLabel(m: number): string { return DISPOSAL_METHOD_LABELS[m] || String(m); }

  ngOnInit(): void {
    this.api.getDisposalById(this.disposalId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load disposal details')
    });
  }

  approve(): void {
    this.approving = true;
    this.api.approveDisposal(this.disposalId(), { actorId: this.authStore.user()?.id || '' }).subscribe({
      next: () => { this.approving = false; this.notify.success('Success', 'Disposal approved — stock written off'); this.updated.emit(); this.closed.emit(); },
      error: () => { this.approving = false; this.notify.error('Error', 'Failed to approve disposal'); }
    });
  }

  close(): void { this.closed.emit(); }
}
