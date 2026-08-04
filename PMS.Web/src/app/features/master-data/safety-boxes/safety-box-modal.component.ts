import { Component, Input, output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Warehouse } from '../../../core/models/master-data.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

export interface CreateSafetyBoxRequest {
  boxNumber: string;
  warehouseId: string;
  description?: string;
  category?: string;
  totalShelves: number;
}

@Component({
  selector: 'app-safety-box-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Register New Safety Box</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-row">
            <app-input
              id="boxNumber"
              label="Safety Box Number"
              placeholder="e.g. SB-001"
              [required]="true"
              formControlName="boxNumber">
            </app-input>

            <app-select
              id="warehouseId"
              label="Assigned Warehouse"
              [required]="true"
              [options]="warehouseOptions"
              formControlName="warehouseId">
            </app-select>
          </div>

          <div class="form-row">
            <app-input
              id="category"
              label="Category Class"
              placeholder="e.g. Secure Assets / Electronics"
              formControlName="category">
            </app-input>

            <app-input
              id="totalShelves"
              type="number"
              label="Number of Shelves"
              placeholder="e.g. 4"
              [required]="true"
              formControlName="totalShelves">
            </app-input>
          </div>

          <app-input
            id="description"
            label="Description & Specifications"
            placeholder="e.g. Fireproof high-security safe box"
            formControlName="description">
          </app-input>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Save Safety Box</app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-card {
      background-color: var(--bg-surface);
      border-radius: var(--radius-lg);
      width: 100%; max-width: 540px;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
      h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    }
    .close-btn { font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `]
})
export class SafetyBoxModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() warehouses: Warehouse[] = [];
  @Input() loading = false;

  saveBox = output<CreateSafetyBoxRequest>();
  cancel = output<void>();

  warehouseOptions: SelectOption[] = [];

  form = this.fb.group({
    boxNumber: ['', Validators.required],
    warehouseId: ['', Validators.required],
    category: ['Secure Assets'],
    totalShelves: [4, [Validators.required, Validators.min(1)]],
    description: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['warehouses']) {
      this.warehouseOptions = this.warehouses.map((w) => ({
        label: w.warehouseName,
        value: w.id
      }));
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saveBox.emit({
      boxNumber: raw.boxNumber || '',
      warehouseId: raw.warehouseId || '',
      category: raw.category || undefined,
      totalShelves: Number(raw.totalShelves),
      description: raw.description || undefined
    });
    this.form.reset({ totalShelves: 4, category: 'Secure Assets' });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
