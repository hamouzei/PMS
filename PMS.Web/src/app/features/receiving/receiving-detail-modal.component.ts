import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceivingApiService, RecordInspectionPayload, ReleaseReceivingPayload } from '../../core/services/receiving-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { ReceivingNote, WorkflowStatus } from '../../core/models/workflow.model';

@Component({
  selector: 'app-receiving-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Receiving Detail — {{ detail?.grnNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">GRN #</span><span>{{ detail.grnNumber }}</span></div>
            <div class="meta-item" *ngIf="detail.farnNumber"><span class="meta-label">FARN #</span><span>{{ detail.farnNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">Invoice #</span><span>{{ detail.invoiceNumber || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">PO #</span><span>{{ detail.purchaseOrderNumber || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span>{{ detail.receivedDate | ethiopianDate }}</span></div>
          </div>

          <h4 class="section-title">Line Items</h4>
          <table class="detail-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Unit Cost</th><th>Tag #</th><th>Serial #</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detail.details">
                <td>{{ d.item?.itemName || d.itemId }}</td>
                <td>{{ d.quantityReceived }}</td>
                <td>{{ d.unitCost | number:'1.2-2' }}</td>
                <td>{{ d.tagNumber || '—' }}</td>
                <td>{{ d.serialNumber || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Inspection Section -->
          <div *ngIf="canInspect" class="action-section">
            <h4 class="section-title">🔍 Record Inspection</h4>
            <div class="form-row">
              <label><input type="checkbox" [(ngModel)]="inspectionPassed" /> Inspection Passed</label>
              <input *ngIf="!inspectionPassed" [(ngModel)]="deviationNotes" class="form-control" placeholder="Deviation notes..." />
            </div>
            <app-button variant="gold" (btnClick)="inspect()" [loading]="inspecting">
              <span>🔍 Submit Inspection</span>
            </app-button>
          </div>

          <!-- Release Section -->
          <div *ngIf="canRelease" class="action-section">
            <h4 class="section-title">📦 Release to Stock</h4>
            <app-button variant="gold" (btnClick)="release()" [loading]="releasing">
              <span>✅ Release to Stock</span>
            </app-button>
          </div>

          <!-- Inspection log -->
          <div *ngIf="detail.inspectionLog" class="info-box">
            <strong>Inspection:</strong>
            {{ detail.inspectionLog.isPassed ? '✅ Passed' : '❌ Failed' }}
            <span *ngIf="detail.inspectionLog.deviationNotes"> — {{ detail.inspectionLog.deviationNotes }}</span>
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
    .modal-lg { max-width: 850px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 1rem; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } }
    .action-section { margin-top: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .form-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; flex: 1; min-width: 200px; }
    .info-box { margin-top: 1rem; padding: 0.75rem 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-size: 0.875rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReceivingDetailModalComponent implements OnInit {
  private readonly api = inject(ReceivingApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  receivingId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: ReceivingNote | null = null;
  inspecting = false; releasing = false;
  inspectionPassed = true; deviationNotes = '';

  get canInspect(): boolean {
    return !!this.detail && (this.detail.status === WorkflowStatus.Received || this.detail.status === WorkflowStatus.InspectionPending)
      && this.authStore.hasRole(['PropertyAdmin', 'Inspector', 'Storekeeper']);
  }

  get canRelease(): boolean {
    return !!this.detail && this.detail.status === WorkflowStatus.InspectionPassed
      && this.authStore.hasRole(['PropertyAdmin', 'Storekeeper']);
  }

  ngOnInit(): void {
    this.api.getReceivingById(this.receivingId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load receiving details')
    });
  }

  inspect(): void {
    this.inspecting = true;
    const payload: RecordInspectionPayload = {
      receivingNoteId: this.receivingId(),
      inspectorId: this.authStore.user()?.id || '',
      isPassed: this.inspectionPassed,
      deviationNotes: this.deviationNotes || undefined
    };
    this.api.recordInspection(this.receivingId(), payload).subscribe({
      next: () => {
        this.inspecting = false;
        this.notify.success('Success', this.inspectionPassed ? 'Inspection passed' : 'Inspection failed — noted');
        this.updated.emit(); this.closed.emit();
      },
      error: () => { this.inspecting = false; this.notify.error('Error', 'Failed to record inspection'); }
    });
  }

  release(): void {
    this.releasing = true;
    const payload: ReleaseReceivingPayload = {
      receivingNoteId: this.receivingId(),
      releasedById: this.authStore.user()?.id || ''
    };
    this.api.releaseToStock(this.receivingId(), payload).subscribe({
      next: () => {
        this.releasing = false;
        this.notify.success('Success', 'Items released to stock with tag numbers generated');
        this.updated.emit(); this.closed.emit();
      },
      error: () => { this.releasing = false; this.notify.error('Error', 'Failed to release to stock'); }
    });
  }

  close(): void { this.closed.emit(); }
}
