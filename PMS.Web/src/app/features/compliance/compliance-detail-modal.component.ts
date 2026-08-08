import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ComplianceRecord, WorkflowStatus } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-compliance-detail-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="shield-check" [size]="20"></app-icon> Compliance — {{ detail?.complianceNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">Compliance #</span><span>{{ detail.complianceNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">Reviewed By</span><span>{{ detail.reviewedBy?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Review Date</span><span>{{ detail.reviewDate | ethiopianDate }}</span></div>
            <div class="meta-item" *ngIf="detail.inventory"><span class="meta-label">Linked Inventory</span><span>{{ detail.inventory.inventoryNumber }}</span></div>
          </div>

          <div class="content-section" *ngIf="detail.findings">
            <h4 class="section-title"><app-icon name="search" [size]="16"></app-icon> Findings</h4>
            <p class="content-text">{{ detail.findings }}</p>
          </div>

          <div class="content-section" *ngIf="detail.recommendations">
            <h4 class="section-title"><app-icon name="clipboard-list" [size]="16"></app-icon> Recommendations</h4>
            <p class="content-text">{{ detail.recommendations }}</p>
          </div>

          <div class="content-section" *ngIf="detail.correctiveActions">
            <h4 class="section-title"><app-icon name="settings" [size]="16"></app-icon> Corrective Actions</h4>
            <p class="content-text">{{ detail.correctiveActions }}</p>
          </div>

          <div *ngIf="canClose" class="action-section">
            <h4 class="section-title">Close Record</h4>
            <p class="action-hint">Closing marks all corrective actions as resolved.</p>
            <app-button variant="gold" (btnClick)="closeRecord()" [loading]="closing">
              <span><app-icon name="check-circle" [size]="16"></app-icon> Close Compliance Record</span>
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
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 700px; overflow-y: auto; max-height: 90vh; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; }
    .content-section { padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1rem; }
    .content-text { font-size: 0.875rem; color: var(--text-primary); white-space: pre-wrap; line-height: 1.5; }
    .action-section { margin-top: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .action-hint { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ComplianceDetailModalComponent implements OnInit {
  private readonly api = inject(ComplianceApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  complianceId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: ComplianceRecord | null = null;
  closing = false;

  get canClose(): boolean {
    return !!this.detail && this.detail.status === WorkflowStatus.Submitted
      && this.authStore.hasRole(['PropertyAdmin', 'ComplianceOfficer']);
  }

  ngOnInit(): void {
    this.api.getRecordById(this.complianceId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load compliance details')
    });
  }

  closeRecord(): void {
    this.closing = true;
    this.api.closeRecord(this.complianceId(), { actorId: this.authStore.user()?.id || '' }).subscribe({
      next: () => { this.closing = false; this.notify.success('Success', 'Compliance record closed'); this.updated.emit(); this.closed.emit(); },
      error: () => { this.closing = false; this.notify.error('Error', 'Failed to close compliance record'); }
    });
  }

  close(): void { this.closed.emit(); }
}
