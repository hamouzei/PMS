import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustodyApiService, CustodyRecord, CreateReturnPayload, ReturnLinePayload, PagedResult } from '../../core/services/custody-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { PropertyCondition } from '../../core/models/workflow.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-return-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="rotate-ccw" [size]="20"></app-icon> New Property Return (RMRN)</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-group">
            <label>Reason for Return</label>
            <textarea formControlName="reason" class="form-control" rows="2" placeholder="e.g. End of assignment, equipment upgrade..."></textarea>
          </div>

          <div class="section-divider">
            <h4>Return Items (from your custody)</h4>
            <app-button variant="ghost" type="button" (btnClick)="addLine()">
              <span><app-icon name="plus" [size]="16"></app-icon> Add Item</span>
            </app-button>
          </div>

          <div *ngIf="custodyItems.length === 0 && !loadingCustody" class="empty-state">
            You have no items in custody to return.
          </div>
          <div *ngIf="loadingCustody" class="loading-state">
            <div class="spinner"></div> Loading custody items...
          </div>

          <div formArrayName="details" class="lines-container">
            <div *ngFor="let line of detailControls.controls; let i = index" [formGroupName]="i" class="line-row">
              <div class="form-group flex-2">
                <label>Custody Item *</label>
                <select formControlName="custodyIndex" class="form-control" (change)="onCustodySelected(i)">
                  <option value="">Select Item</option>
                  <option *ngFor="let c of custodyItems; let j = index" [value]="j">
                    {{ c.itemName }} — Tag: {{ c.tagNumber || 'N/A' }} (Qty: {{ c.quantity }})
                  </option>
                </select>
              </div>
              <div class="form-group flex-half">
                <label>Qty *</label>
                <input type="number" formControlName="quantity" class="form-control" min="1" />
              </div>
              <div class="form-group flex-1">
                <label>Condition *</label>
                <select formControlName="condition" class="form-control">
                  <option [value]="1">New</option>
                  <option [value]="2">Functional Used</option>
                  <option [value]="3">Damaged</option>
                  <option [value]="4">Obsolete</option>
                  <option [value]="5">Non-Functional</option>
                </select>
              </div>
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || detailControls.length === 0">
              <span><app-icon name="check" [size]="16"></app-icon> Submit Return</span>
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
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .section-divider { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; h4 { font-size: 0.9375rem; font-weight: 600; } }
    .lines-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .line-row { display: flex; gap: 0.5rem; align-items: flex-end; padding: 0.75rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap; }
    .flex-2 { flex: 2; min-width: 200px; } .flex-1 { flex: 1; min-width: 120px; } .flex-half { flex: 0.5; min-width: 80px; }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .empty-state { text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.875rem; }
    .loading-state { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; color: var(--text-muted); font-size: 0.875rem; }
    .spinner { width: 20px; height: 20px; border: 2px solid var(--border-color); border-top-color: var(--ecx-navy-primary); border-radius: 50%; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) { .line-row { flex-direction: column; align-items: stretch; } }
  `]
})
export class ReturnFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustodyApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();

  custodyItems: CustodyRecord[] = [];
  loadingCustody = true;
  saving = false;
  shelves: { id: string; shelfNumber: string }[] = [];

  form: FormGroup = this.fb.group({
    reason: [''],
    details: this.fb.array([])
  });

  get detailControls(): FormArray { return this.form.get('details') as FormArray; }

  ngOnInit(): void {
    const userId = this.authStore.user()?.id;
    if (userId) {
      this.api.getCustodyRecords(1, 200, userId).subscribe({
        next: (result) => { this.custodyItems = result.items; this.loadingCustody = false; },
        error: () => { this.loadingCustody = false; }
      });
    } else {
      this.loadingCustody = false;
    }

    this.masterApi.getShelves().subscribe({
      next: (s) => this.shelves = s.map(sh => ({ id: sh.id, shelfNumber: sh.shelfNumber })),
      error: () => { /* shelves optional */ }
    });

    this.addLine();
  }

  addLine(): void {
    this.detailControls.push(this.fb.group({
      custodyIndex: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      condition: [PropertyCondition.FunctionalUsed, Validators.required]
    }));
  }

  removeLine(index: number): void { this.detailControls.removeAt(index); }

  onCustodySelected(lineIndex: number): void {
    const ci = Number(this.detailControls.at(lineIndex).get('custodyIndex')?.value);
    if (!isNaN(ci) && this.custodyItems[ci]) {
      const maxQty = this.custodyItems[ci].quantity;
      const qtyCtrl = this.detailControls.at(lineIndex).get('quantity');
      if (qtyCtrl && (qtyCtrl.value > maxQty)) {
        qtyCtrl.setValue(maxQty);
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.detailControls.length === 0) return;
    this.saving = true;
    const user = this.authStore.user();
    const formVal = this.form.getRawValue();

    const defaultShelfId = this.shelves.length > 0 ? this.shelves[0].id : '00000000-0000-0000-0000-000000000000';

    const details: ReturnLinePayload[] = formVal.details.map((d: Record<string, unknown>) => {
      const ci = Number(d['custodyIndex']);
      const custody = this.custodyItems[ci];
      return {
        itemId: custody?.itemId || '',
        shelfId: defaultShelfId,
        quantity: Number(d['quantity']),
        condition: Number(d['condition']),
        tagNumber: custody?.tagNumber || undefined,
        serialNumber: custody?.serialNumber || undefined
      };
    });

    const request: CreateReturnPayload = {
      returnedById: user?.id || '',
      reason: formVal.reason || undefined,
      details
    };

    this.api.createReturn(request).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create return'); }
    });
  }

  close(): void { this.closed.emit(); }
}
