import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CustodyApiService, CreateHandoverPayload, HandoverLinePayload } from '../../core/services/custody-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { AdminApiService } from '../../core/services/admin-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-handover-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>🤝 New Property Handover</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Handover From *</label>
              <select formControlName="handoverFromId" class="form-control">
                <option value="">Select Staff</option>
                <option *ngFor="let u of users" [value]="u.id">{{ u.fullName }} ({{ u.employeeId }})</option>
              </select>
            </div>
            <div class="form-group">
              <label>Handover To *</label>
              <select formControlName="handoverToId" class="form-control">
                <option value="">Select Staff</option>
                <option *ngFor="let u of users" [value]="u.id">{{ u.fullName }} ({{ u.employeeId }})</option>
              </select>
            </div>
            <div class="form-group">
              <label>From Location</label>
              <input formControlName="fromLocation" class="form-control" placeholder="e.g. HO Addis Ababa" />
            </div>
            <div class="form-group">
              <label>To Location</label>
              <input formControlName="toLocation" class="form-control" placeholder="e.g. Branch Dire Dawa" />
            </div>
            <div class="form-group full-width">
              <label>Purpose</label>
              <input formControlName="purpose" class="form-control" placeholder="e.g. Annual staff rotation" />
            </div>
            <div class="form-group full-width">
              <label>Remarks</label>
              <textarea formControlName="remarks" class="form-control" rows="2"></textarea>
            </div>
          </div>

          <div class="section-divider">
            <h4>Handover Items</h4>
            <app-button variant="ghost" type="button" (btnClick)="addLine()">
              <span>➕ Add Item</span>
            </app-button>
          </div>

          <div formArrayName="details" class="lines-container">
            <div *ngFor="let line of detailControls.controls; let i = index" [formGroupName]="i" class="line-row">
              <div class="form-group flex-2">
                <label>Item *</label>
                <select formControlName="itemId" class="form-control">
                  <option value="">Select Item</option>
                  <option *ngFor="let item of itemOptions" [value]="item.id">
                    {{ item.sku }} — {{ item.itemName }}
                  </option>
                </select>
              </div>
              <div class="form-group flex-half">
                <label>Qty *</label>
                <input type="number" formControlName="quantity" class="form-control" min="1" />
              </div>
              <div class="form-group flex-1">
                <label>FARN #</label>
                <input formControlName="farnNumber" class="form-control" placeholder="Optional" />
              </div>
              <div class="form-group flex-1">
                <label>RMRN #</label>
                <input formControlName="rmrnNumber" class="form-control" placeholder="Optional" />
              </div>
              <div class="form-group flex-1">
                <label>FAIV #</label>
                <input formControlName="faivNumber" class="form-control" placeholder="Optional" />
              </div>
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || detailControls.length === 0">
              <span>🤝 Submit Handover</span>
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; overflow-y: auto; max-height: 90vh; }
    .modal-lg { max-width: 950px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .full-width { grid-column: 1 / -1; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .section-divider { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; h4 { font-size: 0.9375rem; font-weight: 600; } }
    .lines-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .line-row { display: flex; gap: 0.5rem; align-items: flex-end; padding: 0.75rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap; }
    .flex-2 { flex: 2; min-width: 200px; } .flex-1 { flex: 1; min-width: 100px; } .flex-half { flex: 0.5; min-width: 70px; }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .line-row { flex-direction: column; align-items: stretch; } }
  `]
})
export class HandoverFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustodyApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly adminApi = inject(AdminApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();

  users: { id: string; fullName: string; employeeId: string }[] = [];
  itemOptions: { id: string; sku: string; itemName: string }[] = [];
  saving = false;

  form: FormGroup = this.fb.group({
    handoverFromId: ['', Validators.required],
    handoverToId: ['', Validators.required],
    fromLocation: [''],
    toLocation: [''],
    purpose: [''],
    remarks: [''],
    details: this.fb.array([])
  });

  get detailControls(): FormArray { return this.form.get('details') as FormArray; }

  ngOnInit(): void {
    this.adminApi.getUsers().subscribe({
      next: (users) => this.users = users.map(u => ({ id: u.id, fullName: u.fullName, employeeId: u.employeeId })),
      error: () => { /* users will remain empty */ }
    });

    this.masterApi.searchItems().subscribe({
      next: (items) => this.itemOptions = items.map(it => ({ id: it.id, sku: it.sku, itemName: it.itemName })),
      error: () => { /* items will remain empty */ }
    });

    // Default "from" to current user
    const userId = this.authStore.user()?.id;
    if (userId) {
      this.form.patchValue({ handoverFromId: userId });
    }

    this.addLine();
  }

  addLine(): void {
    this.detailControls.push(this.fb.group({
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      farnNumber: [''],
      rmrnNumber: [''],
      faivNumber: ['']
    }));
  }

  removeLine(index: number): void { this.detailControls.removeAt(index); }

  onSubmit(): void {
    if (this.form.invalid || this.detailControls.length === 0) return;
    this.saving = true;
    const formVal = this.form.getRawValue();

    const details: HandoverLinePayload[] = formVal.details.map((d: Record<string, unknown>) => ({
      itemId: d['itemId'] as string,
      quantity: Number(d['quantity']),
      farnNumber: (d['farnNumber'] as string) || undefined,
      rmrnNumber: (d['rmrnNumber'] as string) || undefined,
      faivNumber: (d['faivNumber'] as string) || undefined
    }));

    const request: CreateHandoverPayload = {
      handoverFromId: formVal.handoverFromId,
      handoverToId: formVal.handoverToId,
      purpose: formVal.purpose || undefined,
      fromLocation: formVal.fromLocation || undefined,
      toLocation: formVal.toLocation || undefined,
      remarks: formVal.remarks || undefined,
      details
    };

    this.api.createHandover(request).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create handover'); }
    });
  }

  close(): void { this.closed.emit(); }
}
