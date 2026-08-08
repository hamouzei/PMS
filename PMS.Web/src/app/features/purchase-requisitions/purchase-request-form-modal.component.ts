import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { RequisitionApiService, CreatePurchaseRequestPayload, StockLinePayload } from '../../core/services/requisition-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-purchase-request-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="shopping-cart" [size]="20"></app-icon> New Purchase Requisition</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Request Type *</label>
              <select formControlName="requestType" class="form-control">
                <option [value]="0">Consumable</option>
                <option [value]="1">Fixed Asset</option>
              </select>
            </div>
            <div class="form-group">
              <label>Estimated Budget</label>
              <input type="number" formControlName="estimatedBudget" class="form-control" step="0.01" placeholder="0.00" />
            </div>
            <div class="form-group full-width">
              <label>Justification</label>
              <textarea formControlName="justification" class="form-control" rows="2" placeholder="Why is this purchase needed?"></textarea>
            </div>
          </div>

          <div class="section-divider">
            <h4>Items to Purchase</h4>
            <app-button variant="ghost" type="button" (btnClick)="addLine()">
              <span><app-icon name="plus" [size]="16"></app-icon> Add Item</span>
            </app-button>
          </div>

          <div formArrayName="details" class="lines-container">
            <div *ngFor="let line of detailControls.controls; let i = index" [formGroupName]="i" class="line-row">
              <div class="form-group flex-2">
                <label>Item *</label>
                <select formControlName="itemId" class="form-control">
                  <option value="">Select Item</option>
                  <option *ngFor="let it of items" [value]="it.id">{{ it.sku }} — {{ it.itemName }}</option>
                </select>
              </div>
              <div class="form-group flex-half">
                <label>Qty *</label>
                <input type="number" formControlName="quantity" class="form-control" min="1" />
              </div>
              <div class="form-group flex-half">
                <label>Unit Cost</label>
                <input type="number" formControlName="unitCost" class="form-control" step="0.01" />
              </div>
              <div class="form-group flex-1">
                <label>Remarks</label>
                <input formControlName="remarks" class="form-control" />
              </div>
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || detailControls.length === 0">
              <span><app-icon name="check" [size]="16"></app-icon> Submit Request</span>
            </app-button>
          </div>
        </form>
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
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 0 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .section-divider { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; h4 { font-size: 0.9375rem; font-weight: 600; } }
    .lines-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .line-row { display: flex; gap: 0.5rem; align-items: flex-end; padding: 0.75rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap; }
    .flex-2 { flex: 2; min-width: 180px; } .flex-1 { flex: 1; min-width: 100px; } .flex-half { flex: 0.5; min-width: 70px; }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  `]
})
export class PurchaseRequestFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RequisitionApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;
  items: { id: string; sku: string; itemName: string }[] = [];

  form: FormGroup = this.fb.group({
    requestType: [0, Validators.required],
    justification: [''],
    estimatedBudget: [null],
    details: this.fb.array([])
  });

  get detailControls(): FormArray { return this.form.get('details') as FormArray; }

  ngOnInit(): void {
    this.masterApi.searchItems().subscribe({ next: (i) => this.items = i.map(x => ({ id: x.id, sku: x.sku, itemName: x.itemName })) });
    this.addLine();
  }

  addLine(): void {
    this.detailControls.push(this.fb.group({
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [null],
      remarks: ['']
    }));
  }

  removeLine(i: number): void { this.detailControls.removeAt(i); }

  onSubmit(): void {
    if (this.form.invalid || this.detailControls.length === 0) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const details: StockLinePayload[] = v.details.map((d: Record<string, unknown>) => ({
      itemId: d['itemId'] as string,
      quantity: Number(d['quantity']),
      unitCost: d['unitCost'] ? Number(d['unitCost']) : undefined,
      remarks: (d['remarks'] as string) || undefined
    }));
    const payload: CreatePurchaseRequestPayload = {
      requesterId: this.authStore.user()?.id || '',
      requestType: Number(v.requestType),
      justification: v.justification || undefined,
      estimatedBudget: v.estimatedBudget ? Number(v.estimatedBudget) : undefined,
      details
    };
    this.api.createPurchaseRequest(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create purchase request'); }
    });
  }

  close(): void { this.closed.emit(); }
}
