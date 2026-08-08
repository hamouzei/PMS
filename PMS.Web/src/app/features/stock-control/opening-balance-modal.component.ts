import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { StockApiService, OpeningBalancePayload } from '../../core/services/stock-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-opening-balance-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 Register Opening Balance</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-group">
            <label>Item *</label>
            <select formControlName="itemId" class="form-control">
              <option value="">Select Item</option>
              <option *ngFor="let it of items" [value]="it.id">{{ it.sku }} — {{ it.itemName }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Shelf Location *</label>
            <select formControlName="shelfId" class="form-control">
              <option value="">Select Shelf</option>
              <option *ngFor="let sh of shelves" [value]="sh.id">{{ sh.shelfNumber }}</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Quantity *</label>
              <input type="number" formControlName="quantity" class="form-control" min="1" />
            </div>
            <div class="form-group flex-1">
              <label>Unit Cost</label>
              <input type="number" formControlName="unitCost" class="form-control" step="0.01" />
            </div>
          </div>
          <div class="form-group">
            <label>Reason</label>
            <textarea formControlName="reason" class="form-control" rows="2" placeholder="Initial stock count, migration, etc."></textarea>
          </div>
          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid">
              <span>📋 Register Balance</span>
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 520px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .form-row { display: flex; gap: 1rem; } .flex-1 { flex: 1; }
  `]
})
export class OpeningBalanceModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StockApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;

  items: { id: string; sku: string; itemName: string }[] = [];
  shelves: { id: string; shelfNumber: string }[] = [];

  form: FormGroup = this.fb.group({
    itemId: ['', Validators.required],
    shelfId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [null],
    reason: ['']
  });

  ngOnInit(): void {
    this.masterApi.searchItems().subscribe({ next: (i) => this.items = i.map(x => ({ id: x.id, sku: x.sku, itemName: x.itemName })) });
    this.masterApi.getShelves().subscribe({ next: (s) => this.shelves = s.map(x => ({ id: x.id, shelfNumber: x.shelfNumber })) });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const payload: OpeningBalancePayload = {
      itemId: v.itemId, shelfId: v.shelfId,
      quantity: Number(v.quantity),
      unitCost: v.unitCost ? Number(v.unitCost) : undefined,
      reason: v.reason || undefined
    };
    this.api.registerOpeningBalance(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to register opening balance'); }
    });
  }

  close(): void { this.closed.emit(); }
}
