import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ReceivingApiService, CreateReceivingPayload, ReceivingLinePayload } from '../../core/services/receiving-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-receiving-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="inbox" [size]="20"></app-icon> New Receiving Note</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Supplier *</label>
              <select formControlName="supplierId" class="form-control">
                <option value="">Select Supplier</option>
                <option *ngFor="let s of suppliers" [value]="s.id">{{ s.supplierName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Warehouse *</label>
              <select formControlName="warehouseId" class="form-control">
                <option value="">Select Warehouse</option>
                <option *ngFor="let w of warehouses" [value]="w.id">{{ w.warehouseName }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Invoice Number</label>
              <input formControlName="invoiceNumber" class="form-control" placeholder="INV-001" />
            </div>
            <div class="form-group">
              <label>Purchase Order #</label>
              <input formControlName="purchaseOrderNumber" class="form-control" />
            </div>
            <div class="form-group">
              <label>Tender Reference #</label>
              <input formControlName="tenderReferenceNumber" class="form-control" />
            </div>
            <div class="form-group">
              <label>Store Request #</label>
              <input formControlName="storeRequestNumber" class="form-control" />
            </div>
            <div class="form-group full-width">
              <label>Notes</label>
              <textarea formControlName="notes" class="form-control" rows="2"></textarea>
            </div>
          </div>

          <div class="section-divider">
            <h4>Received Items</h4>
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
              <div class="form-group flex-1">
                <label>Shelf</label>
                <select formControlName="shelfId" class="form-control">
                  <option value="">Auto</option>
                  <option *ngFor="let sh of shelves" [value]="sh.id">{{ sh.shelfNumber }}</option>
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
                <label>Tag #</label>
                <input formControlName="tagNumber" class="form-control" />
              </div>
              <div class="form-group flex-1">
                <label>Serial #</label>
                <input formControlName="serialNumber" class="form-control" />
              </div>
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || detailControls.length === 0">
              <span><app-icon name="check" [size]="16"></app-icon> Create Receiving Note</span>
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
    .flex-2 { flex: 2; min-width: 180px; } .flex-1 { flex: 1; min-width: 100px; } .flex-half { flex: 0.5; min-width: 70px; }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    @media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .line-row { flex-direction: column; align-items: stretch; } }
  `]
})
export class ReceivingFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReceivingApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;

  suppliers: { id: string; supplierName: string }[] = [];
  warehouses: { id: string; warehouseName: string }[] = [];
  items: { id: string; sku: string; itemName: string }[] = [];
  shelves: { id: string; shelfNumber: string }[] = [];

  form: FormGroup = this.fb.group({
    supplierId: ['', Validators.required],
    warehouseId: ['', Validators.required],
    invoiceNumber: [''],
    purchaseOrderNumber: [''],
    tenderReferenceNumber: [''],
    storeRequestNumber: [''],
    notes: [''],
    details: this.fb.array([])
  });

  get detailControls(): FormArray { return this.form.get('details') as FormArray; }

  ngOnInit(): void {
    this.masterApi.getSuppliers().subscribe({ next: (s) => this.suppliers = s.map(x => ({ id: x.id, supplierName: x.supplierName })) });
    this.masterApi.getWarehouses().subscribe({ next: (w) => this.warehouses = w.map(x => ({ id: x.id, warehouseName: x.warehouseName })) });
    this.masterApi.searchItems().subscribe({ next: (i) => this.items = i.map(x => ({ id: x.id, sku: x.sku, itemName: x.itemName })) });
    this.masterApi.getShelves().subscribe({ next: (s) => this.shelves = s.map(x => ({ id: x.id, shelfNumber: x.shelfNumber })) });
    this.addLine();
  }

  addLine(): void {
    this.detailControls.push(this.fb.group({
      itemId: ['', Validators.required],
      shelfId: [''],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [null],
      tagNumber: [''],
      serialNumber: ['']
    }));
  }

  removeLine(i: number): void { this.detailControls.removeAt(i); }

  onSubmit(): void {
    if (this.form.invalid || this.detailControls.length === 0) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const details: ReceivingLinePayload[] = v.details.map((d: Record<string, unknown>) => ({
      itemId: d['itemId'] as string,
      shelfId: (d['shelfId'] as string) || undefined,
      quantity: Number(d['quantity']),
      unitCost: d['unitCost'] ? Number(d['unitCost']) : undefined,
      tagNumber: (d['tagNumber'] as string) || undefined,
      serialNumber: (d['serialNumber'] as string) || undefined
    }));
    const req: CreateReceivingPayload = {
      supplierId: v.supplierId,
      warehouseId: v.warehouseId,
      receivedById: this.authStore.user()?.id || '',
      invoiceNumber: v.invoiceNumber || undefined,
      purchaseOrderNumber: v.purchaseOrderNumber || undefined,
      storeRequestNumber: v.storeRequestNumber || undefined,
      tenderReferenceNumber: v.tenderReferenceNumber || undefined,
      notes: v.notes || undefined,
      details
    };
    this.api.createReceiving(req).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create receiving note'); }
    });
  }

  close(): void { this.closed.emit(); }
}
