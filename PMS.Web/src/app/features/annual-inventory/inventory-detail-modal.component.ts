import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnualInventoryApiService } from '../../core/services/annual-inventory-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';
import { AnnualInventory, WorkflowStatus } from '../../core/models/workflow.model';

@Component({
  selector: 'app-inventory-detail-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent, StatusBadgeComponent, EthiopianDatePipe],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Inventory — {{ detail?.inventoryNumber }}</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <div class="modal-body" *ngIf="detail; else loadingTpl">
          <div class="meta-grid">
            <div class="meta-item"><span class="meta-label">Status</span><app-status-badge [status]="detail.status"></app-status-badge></div>
            <div class="meta-item"><span class="meta-label">Inventory #</span><span>{{ detail.inventoryNumber }}</span></div>
            <div class="meta-item"><span class="meta-label">Fiscal Year</span><span>EFY {{ detail.fiscalYear }}</span></div>
            <div class="meta-item"><span class="meta-label">Location</span><span>{{ detail.location }}</span></div>
            <div class="meta-item"><span class="meta-label">Counted By</span><span>{{ detail.countedBy?.fullName || '—' }}</span></div>
            <div class="meta-item"><span class="meta-label">Count Date</span><span>{{ detail.countDate | ethiopianDate }}</span></div>
          </div>

          <h4 class="section-title">Count Sheet ({{ detail.lines.length }} lines)</h4>

          <div *ngIf="discrepancyCount > 0" class="discrepancy-banner">
            ⚠️ <strong>{{ discrepancyCount }}</strong> item(s) have discrepancies.
            Total: <strong>{{ totalDiscrepancy > 0 ? '+' : '' }}{{ totalDiscrepancy }}</strong>
          </div>

          <div class="table-scroll">
            <table class="detail-table">
              <thead><tr><th>Item</th><th>Shelf</th><th>Expected</th><th>Counted</th><th>Discrepancy</th><th>Notes</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of detail.lines" [class.has-discrepancy]="l.discrepancy !== 0">
                  <td>{{ l.item?.itemName || l.itemId }}</td>
                  <td>{{ l.shelf?.shelfNumber || '—' }}</td>
                  <td>{{ l.expectedQuantity }}</td>
                  <td>{{ l.countedQuantity }}</td>
                  <td class="discrepancy-cell" [class.positive]="l.discrepancy > 0" [class.negative]="l.discrepancy < 0">
                    {{ l.discrepancy > 0 ? '+' : '' }}{{ l.discrepancy }}
                  </td>
                  <td>{{ l.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="canComplete" class="action-section">
            <h4 class="section-title">Finalize Inventory</h4>
            <p class="action-hint">Completing the inventory will lock the count sheet and trigger discrepancy alerts.</p>
            <app-button variant="gold" (btnClick)="complete()" [loading]="completing">
              <span>✅ Complete Inventory</span>
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
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; overflow-y: auto; max-height: 90vh; }
    .modal-lg { max-width: 900px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem 1.5rem; margin-bottom: 1.5rem; }
    .meta-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .meta-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
    .section-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
    .discrepancy-banner { padding: 0.75rem 1rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: var(--radius-md); color: var(--ecx-warning); font-size: 0.875rem; margin-bottom: 1rem; }
    .table-scroll { overflow-x: auto; margin-bottom: 1rem; }
    .detail-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color); text-align: left; } th { font-weight: 600; color: var(--text-secondary); font-size: 0.75rem; text-transform: uppercase; } tr.has-discrepancy { background: rgba(239, 68, 68, 0.05); } }
    .discrepancy-cell { font-weight: 700; } .discrepancy-cell.positive { color: var(--ecx-success); } .discrepancy-cell.negative { color: var(--ecx-danger); }
    .action-section { margin-top: 1.5rem; padding: 1rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .action-hint { font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 0.75rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 2rem; color: var(--text-muted); font-size: 0.875rem; justify-content: center; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class InventoryDetailModalComponent implements OnInit {
  private readonly api = inject(AnnualInventoryApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  inventoryId = input.required<string>();
  closed = output<void>();
  updated = output<void>();

  detail: AnnualInventory | null = null;
  completing = false;

  get canComplete(): boolean {
    return !!this.detail && this.detail.status === WorkflowStatus.Submitted
      && this.authStore.hasRole(['PropertyAdmin', 'Storekeeper', 'ComplianceOfficer']);
  }

  get discrepancyCount(): number {
    return this.detail?.lines.filter(l => l.discrepancy !== 0).length || 0;
  }

  get totalDiscrepancy(): number {
    return this.detail?.lines.reduce((sum, l) => sum + l.discrepancy, 0) || 0;
  }

  ngOnInit(): void {
    this.api.getInventoryById(this.inventoryId()).subscribe({
      next: (r) => this.detail = r,
      error: () => this.notify.error('Error', 'Failed to load inventory details')
    });
  }

  complete(): void {
    this.completing = true;
    this.api.completeInventory(this.inventoryId(), { actorId: this.authStore.user()?.id || '' }).subscribe({
      next: () => { this.completing = false; this.notify.success('Success', 'Inventory completed — discrepancy alerts triggered'); this.updated.emit(); this.closed.emit(); },
      error: () => { this.completing = false; this.notify.error('Error', 'Failed to complete inventory'); }
    });
  }

  close(): void { this.closed.emit(); }
}
