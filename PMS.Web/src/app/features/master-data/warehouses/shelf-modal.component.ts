import { Component, Input, output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Warehouse } from '../../../core/models/master-data.model';
import { CreateShelfLocationRequest } from '../../../core/services/master-data-api.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-shelf-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Shelf Location & Generate QR Code</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <app-select
            id="warehouseId"
            label="Assigned Warehouse"
            [required]="true"
            [options]="warehouseOptions"
            formControlName="warehouseId">
          </app-select>

          <div class="form-row">
            <app-input
              id="aisle"
              label="Aisle"
              placeholder="e.g. A"
              formControlName="aisle">
            </app-input>

            <app-input
              id="rack"
              label="Rack"
              placeholder="e.g. R1"
              formControlName="rack">
            </app-input>
          </div>

          <div class="form-row">
            <app-input
              id="shelfNumber"
              label="Shelf Number"
              placeholder="e.g. S1"
              [required]="true"
              formControlName="shelfNumber">
            </app-input>

            <app-input
              id="bin"
              label="Bin Identifier"
              placeholder="e.g. B1"
              formControlName="bin">
            </app-input>
          </div>

          <app-input
            id="qrCodeValue"
            label="QR Code Value"
            placeholder="Auto-generated e.g. ECX-HO-A-R1-S1-B1"
            [required]="true"
            formControlName="qrCodeValue">
          </app-input>

          <app-input
            id="capacity"
            type="number"
            label="Shelf Units Capacity"
            placeholder="e.g. 100"
            formControlName="capacity">
          </app-input>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Save Shelf Location</app-button>
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
      width: 100%; max-width: 560px;
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
export class ShelfModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() warehouses: Warehouse[] = [];
  @Input() loading = false;

  saveShelf = output<CreateShelfLocationRequest>();
  cancel = output<void>();

  warehouseOptions: SelectOption[] = [];

  form = this.fb.group({
    warehouseId: ['', Validators.required],
    aisle: ['A'],
    rack: ['R1'],
    shelfNumber: ['S1', Validators.required],
    bin: ['B1'],
    qrCodeValue: ['ECX-HO-A-R1-S1-B1', Validators.required],
    capacity: [100]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['warehouses']) {
      this.warehouseOptions = this.warehouses.map((w) => ({
        label: `${w.warehouseName} (${w.locationCode})`,
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
    this.saveShelf.emit({
      warehouseId: raw.warehouseId || '',
      aisle: raw.aisle || undefined,
      rack: raw.rack || undefined,
      shelfNumber: raw.shelfNumber || 'S1',
      bin: raw.bin || undefined,
      qrCodeValue: raw.qrCodeValue || 'ECX-HO-A-R1-S1-B1',
      capacity: raw.capacity ? Number(raw.capacity) : undefined
    });
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
