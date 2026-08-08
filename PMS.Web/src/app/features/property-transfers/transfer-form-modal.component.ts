import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustodyApiService, CustodyRecord, CreateTransferPayload, TransferLinePayload, PagedResult } from '../../core/services/custody-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { AdminApiService } from '../../core/services/admin-api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-transfer-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="arrow-left-right" [size]="20"></app-icon> New Property Transfer (RMTN)</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Transfer To (Recipient) *</label>
              <select formControlName="toCustodianId" class="form-control">
                <option value="">Select Recipient</option>
                <option *ngFor="let u of users" [value]="u.id">{{ u.fullName }} ({{ u.employeeId }})</option>
              </select>
            </div>
            <div class="form-group">
              <label>Reason</label>
              <input formControlName="reason" class="form-control" placeholder="e.g. Staff reassignment" />
            </div>
          </div>

          <div class="section-divider">
            <h4>Items to Transfer (from your custody)</h4>
            <app-button variant="ghost" type="button" (btnClick)="addLine()">
              <span><app-icon name="plus" [size]="16"></app-icon> Add Item</span>
            </app-button>
          </div>

          <div *ngIf="custodyItems.length === 0 && !loadingCustody" class="empty-state">
            You have no items in custody to transfer.
          </div>

          <div formArrayName="details" class="lines-container">
            <div *ngFor="let line of detailControls.controls; let i = index" [formGroupName]="i" class="line-row">
              <div class="form-group flex-2">
                <label>Custody Item *</label>
                <select formControlName="custodyIndex" class="form-control">
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
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || detailControls.length === 0">
              <span><app-icon name="check" [size]="16"></app-icon> Submit Transfer</span>
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .section-divider { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; h4 { font-size: 0.9375rem; font-weight: 600; } }
    .lines-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .line-row { display: flex; gap: 0.5rem; align-items: flex-end; padding: 0.75rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap; }
    .flex-2 { flex: 2; min-width: 200px; } .flex-half { flex: 0.5; min-width: 80px; }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .empty-state { text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.875rem; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .line-row { flex-direction: column; align-items: stretch; } }
  `]
})
export class TransferFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustodyApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();

  custodyItems: CustodyRecord[] = [];
  users: { id: string; fullName: string; employeeId: string }[] = [];
  loadingCustody = true;
  saving = false;

  form: FormGroup = this.fb.group({
    toCustodianId: ['', Validators.required],
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

    this.adminApi.getUsers().subscribe({
      next: (users) => this.users = users.map(u => ({ id: u.id, fullName: u.fullName, employeeId: u.employeeId })),
      error: () => { /* users will remain empty */ }
    });

    this.addLine();
  }

  addLine(): void {
    this.detailControls.push(this.fb.group({
      custodyIndex: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeLine(index: number): void { this.detailControls.removeAt(index); }

  onSubmit(): void {
    if (this.form.invalid || this.detailControls.length === 0) return;
    this.saving = true;
    const user = this.authStore.user();
    const formVal = this.form.getRawValue();

    const details: TransferLinePayload[] = formVal.details.map((d: Record<string, unknown>) => {
      const ci = Number(d['custodyIndex']);
      const custody = this.custodyItems[ci];
      return {
        itemId: custody?.itemId || '',
        quantity: Number(d['quantity']),
        tagNumber: custody?.tagNumber || undefined,
        serialNumber: custody?.serialNumber || undefined
      };
    });

    const request: CreateTransferPayload = {
      fromCustodianId: user?.id || '',
      toCustodianId: formVal.toCustodianId,
      reason: formVal.reason || undefined,
      details
    };

    this.api.createTransfer(request).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create transfer'); }
    });
  }

  close(): void { this.closed.emit(); }
}
