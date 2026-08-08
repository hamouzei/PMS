import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AnnualInventoryApiService, CreateAnnualInventoryPayload, InventoryLinePayload } from '../../core/services/annual-inventory-api.service';
import { MasterDataApiService } from '../../core/services/master-data-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/auth/auth.store';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-inventory-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, IconComponent],
  template: `
    <div class="modal-backdrop" (click)="close()">
      <div class="modal-panel modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><app-icon name="bar-chart-3" [size]="20"></app-icon> New Inventory Count</h3>
          <button class="modal-close" (click)="close()">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Fiscal Year (EFY) *</label>
              <input type="number" formControlName="fiscalYear" class="form-control" min="2010" max="2030" />
            </div>
            <div class="form-group">
              <label>Location *</label>
              <input formControlName="location" class="form-control" placeholder="HO / Jimma Branch / etc." />
            </div>
          </div>

          <div class="section-divider">
            <h4>Count Sheet Lines</h4>
            <app-button variant="ghost" type="button" (btnClick)="addLine()">
              <span><app-icon name="plus" [size]="16"></app-icon> Add Line</span>
            </app-button>
          </div>

          <div formArrayName="lines" class="lines-container">
            <div *ngFor="let line of lineControls.controls; let i = index" [formGroupName]="i" class="line-row">
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
                  <option value="">N/A</option>
                  <option *ngFor="let sh of shelves" [value]="sh.id">{{ sh.shelfNumber }}</option>
                </select>
              </div>
              <div class="form-group flex-half">
                <label>Expected *</label>
                <input type="number" formControlName="expectedQuantity" class="form-control" min="0" />
              </div>
              <div class="form-group flex-half">
                <label>Counted *</label>
                <input type="number" formControlName="countedQuantity" class="form-control" min="0" />
              </div>
              <div class="form-group flex-half discrepancy-cell">
                <label>Discrepancy</label>
                <span class="discrepancy-value" [class.has-discrepancy]="getDiscrepancy(i) !== 0">
                  {{ getDiscrepancy(i) }}
                </span>
              </div>
              <div class="form-group flex-1">
                <label>Notes</label>
                <input formControlName="notes" class="form-control" />
              </div>
              <div class="line-actions">
                <button type="button" class="remove-line-btn" (click)="removeLine(i)">&times;</button>
              </div>
            </div>
          </div>

          <div *ngIf="totalDiscrepancy !== 0" class="discrepancy-summary" [class.negative]="totalDiscrepancy < 0">
            <strong>Total Discrepancy: {{ totalDiscrepancy > 0 ? '+' : '' }}{{ totalDiscrepancy }}</strong>
          </div>

          <div class="modal-footer">
            <app-button variant="secondary" type="button" (btnClick)="close()">Cancel</app-button>
            <app-button variant="gold" type="submit" [loading]="saving" [disabled]="form.invalid || lineControls.length === 0">
              <span><app-icon name="check" [size]="16"></app-icon> Create Inventory</span>
            </app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-panel { background: var(--bg-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; overflow-y: auto; max-height: 90vh; }
    .modal-lg { max-width: 1000px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h3 { font-size: 1.125rem; font-weight: 600; } }
    .modal-close { font-size: 1.5rem; color: var(--text-secondary); cursor: pointer; background: none; border: none; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 0 0; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); } }
    .form-control { padding: 0.5rem 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background-color: var(--bg-surface); color: var(--text-primary); }
    .section-divider { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); margin-bottom: 0.75rem; h4 { font-size: 0.9375rem; font-weight: 600; } }
    .lines-container { display: flex; flex-direction: column; gap: 0.75rem; }
    .line-row { display: flex; gap: 0.5rem; align-items: flex-end; padding: 0.75rem; background: var(--bg-app); border-radius: var(--radius-md); border: 1px solid var(--border-color); flex-wrap: wrap; }
    .flex-2 { flex: 2; min-width: 180px; } .flex-1 { flex: 1; min-width: 100px; } .flex-half { flex: 0.5; min-width: 70px; }
    .discrepancy-cell { justify-content: flex-end; }
    .discrepancy-value { font-size: 0.9375rem; font-weight: 700; padding: 0.5rem 0; color: var(--ecx-success); }
    .discrepancy-value.has-discrepancy { color: var(--ecx-danger); }
    .discrepancy-summary { padding: 0.75rem 1rem; margin-top: 0.75rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: var(--radius-md); text-align: center; color: var(--ecx-warning); }
    .discrepancy-summary.negative { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: var(--ecx-danger); }
    .line-actions { display: flex; align-items: center; padding-bottom: 0.25rem; }
    .remove-line-btn { background: var(--ecx-danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  `]
})
export class InventoryFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AnnualInventoryApiService);
  private readonly masterApi = inject(MasterDataApiService);
  private readonly authStore = inject(AuthStore);
  private readonly notify = inject(NotificationService);

  closed = output<void>();
  saved = output<void>();
  saving = false;
  items: { id: string; sku: string; itemName: string }[] = [];
  shelves: { id: string; shelfNumber: string }[] = [];

  form: FormGroup = this.fb.group({
    fiscalYear: [2017, [Validators.required, Validators.min(2010)]],
    location: ['', Validators.required],
    lines: this.fb.array([])
  });

  get lineControls(): FormArray { return this.form.get('lines') as FormArray; }

  get totalDiscrepancy(): number {
    return this.lineControls.controls.reduce((sum, _, i) => sum + this.getDiscrepancy(i), 0);
  }

  ngOnInit(): void {
    this.masterApi.searchItems().subscribe({ next: (i) => this.items = i.map(x => ({ id: x.id, sku: x.sku, itemName: x.itemName })) });
    this.masterApi.getShelves().subscribe({ next: (s) => this.shelves = s.map(x => ({ id: x.id, shelfNumber: x.shelfNumber })) });
    this.addLine();
  }

  addLine(): void {
    this.lineControls.push(this.fb.group({
      itemId: ['', Validators.required],
      shelfId: [''],
      expectedQuantity: [0, [Validators.required, Validators.min(0)]],
      countedQuantity: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    }));
  }

  removeLine(i: number): void { this.lineControls.removeAt(i); }

  getDiscrepancy(i: number): number {
    const line = this.lineControls.at(i);
    return (line.get('countedQuantity')?.value || 0) - (line.get('expectedQuantity')?.value || 0);
  }

  onSubmit(): void {
    if (this.form.invalid || this.lineControls.length === 0) return;
    this.saving = true;
    const v = this.form.getRawValue();
    const lines: InventoryLinePayload[] = v.lines.map((l: Record<string, unknown>) => ({
      itemId: l['itemId'] as string,
      shelfId: (l['shelfId'] as string) || undefined,
      expectedQuantity: Number(l['expectedQuantity']),
      countedQuantity: Number(l['countedQuantity']),
      notes: (l['notes'] as string) || undefined
    }));
    const payload: CreateAnnualInventoryPayload = {
      fiscalYear: Number(v.fiscalYear),
      location: v.location,
      countedById: this.authStore.user()?.id || '',
      lines
    };
    this.api.createInventory(payload).subscribe({
      next: () => { this.saving = false; this.saved.emit(); },
      error: () => { this.saving = false; this.notify.error('Error', 'Failed to create annual inventory'); }
    });
  }

  close(): void { this.closed.emit(); }
}
