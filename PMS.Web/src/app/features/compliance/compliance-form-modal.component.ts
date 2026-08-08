import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ComplianceApiService, CreateCompliancePayload } from '../../core/services/compliance-api.service';
import { AnnualInventoryApiService, InventorySummary } from '../../core/services/annual-inventory-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-compliance-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📝 New Compliance Record</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-group">
            <label>Linked Inventory (optional)</label>
            <select formControlName="inventoryId" class="form-control">
              <option value="">None — standalone review</option>
              <option *ngFor="let inv of inventories" [value]="inv.id">{{ inv.inventoryNumber }} — EFY {{ inv.fiscalYear }} — {{ inv.location }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Findings</label>
            <textarea formControlName="findings" class="form-control" rows="3" placeholder="Describe audit findings..."></textarea>
          </div>
          <div class="form-group">
            <label>Recommendations</label>
            <textarea formControlName="recommendations" class="form-control" rows="3" placeholder="Recommended corrective actions..."></textarea>
          </div>
          <div class="form-group">
            <label>Corrective Actions</label>
            <textarea formControlName="correctiveActions" class="form-control" rows="3" placeholder="Actions taken or planned..."></textarea>
          </div>
          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid">
              <span>📝 Create Record</span>
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 600px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
  `]
})
export class ComplianceFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ComplianceApiService);
  private readonly invApi = inject(AnnualInventoryApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;
  inventories: InventorySummary[] = [];

  form: FormGroup = this.fb.group({
    inventoryId: [''],
    findings: ['', Validators.required],
    recommendations: [''],
    correctiveActions: ['']
  });

  ngOnInit(): void {
    this.invApi.getInventories(1, 100).subscribe({
      next: (r) => this.inventories = r.items,
      error: () => { /* non-blocking */ }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const payload: CreateCompliancePayload = {
      inventoryId: v.inventoryId || undefined,
      reviewedById: this.authStore.user()?.id || '',
      findings: v.findings || undefined,
      recommendations: v.recommendations || undefined,
      correctiveActions: v.correctiveActions || undefined
    };
    this.api.createRecord(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create compliance record'); }
    });
  }

  close(): void { this.closed.emit(); }
}
