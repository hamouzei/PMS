import { Component, Input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateWarehouseRequest } from '../../../core/services/master-data-api.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-warehouse-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Warehouse / Storage Facility</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <app-input
            id="warehouseName"
            label="Warehouse Facility Name"
            placeholder="e.g. Head Office Central Store"
            [required]="true"
            formControlName="warehouseName">
          </app-input>

          <div class="form-row">
            <app-input
              id="locationCode"
              label="Location Code"
              placeholder="e.g. ECX-HO"
              [required]="true"
              formControlName="locationCode">
            </app-input>

            <app-select
              id="locationType"
              label="Facility Type"
              [options]="typeOptions"
              formControlName="locationType">
            </app-select>
          </div>

          <app-input
            id="address"
            label="Physical Address / Location"
            placeholder="e.g. Mexico Square, Head Office HQ"
            formControlName="address">
          </app-input>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Save Facility</app-button>
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
      width: 100%; max-width: 520px;
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
export class WarehouseModalComponent {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() loading = false;

  saveWarehouse = output<CreateWarehouseRequest>();
  cancel = output<void>();

  readonly typeOptions: SelectOption[] = [
    { label: 'Head Office Central Store', value: 'HeadOffice' },
    { label: 'Regional Branch Store', value: 'Branch' },
    { label: 'Regional Trading Center (ReTC)', value: 'ReTC' }
  ];

  form = this.fb.group({
    warehouseName: ['', Validators.required],
    locationCode: ['', Validators.required],
    locationType: ['HeadOffice'],
    address: ['']
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saveWarehouse.emit({
      warehouseName: raw.warehouseName || '',
      locationCode: raw.locationCode || '',
      locationType: raw.locationType || undefined,
      address: raw.address || undefined
    });
    this.form.reset({ locationType: 'HeadOffice' });
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
