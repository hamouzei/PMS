import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssuingApiService } from '../../core/services/issuing-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { StoreIssueVoucher } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-issuing-detail-modal',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, EthiopianDatePipe, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="package" [size]="20"></app-icon> Issue Voucher — {{ detail?.sivNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">SIV #</span><span>{{ detail.sivNumber }}</span></div>
            <div class="meta-item" *ngIf="detail.faivNumber"><span class="meta-label">FAIV #</span><span>{{ detail.faivNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">SR #</span><span>{{ detail.serviceRequest?.srNumber || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Issued By</span><span>{{ detail.issuedBy?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Date</span><span>{{ detail.issueDate | ethiopianDate }}</span></div>
          </div>

          <h4 class="section-title">Issued Items</h4>
          <table class="detail-table">
            <thead><tr><th>Item</th><th>Qty Issued</th><th>Unit Cost</th></tr></thead>
            <tbody>
              <tr *ngFor="let d of detail.details">
                <td>{{ d.item?.itemName || d.itemId }}</td>
                <td>{{ d.quantityIssued }}</td>
                <td>{{ d.unitCost ? (d.unitCost | number:'1.2-2') : '—' }}</td>
              </tr>
            </tbody>
          </table>
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
    .modal-lg { max-width: 750px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class IssuingDetailModalComponent implements OnInit {
  private readonly api = inject(IssuingApiService);
  private readonly notify = inject(NotificationService);

  voucherId = input.required<string>();
  closed = output<void>();

  detail: StoreIssueVoucher | null = null;

  ngOnInit(): void {
    this.api.getVoucherById(this.voucherId()).subscribe({
      next: (v) => this.detail = v,
      error: () => this.notify.error('Error', 'Failed to load voucher details')
    });
  }

  close(): void { this.closed.emit(); }
}
