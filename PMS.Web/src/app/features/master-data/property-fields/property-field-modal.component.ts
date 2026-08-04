import { Component, Input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FieldDataType, PropertyType } from '../../../core/models/master-data.model';
import { CreatePropertyFieldRequest } from '../../../core/services/master-data-api.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-property-field-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Define Custom Property Schema Field</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <app-input
            id="fieldName"
            label="Field Label Name"
            placeholder="e.g. Serial Number, Processor Model, RAM Size"
            [required]="true"
            formControlName="fieldName">
          </app-input>

          <div class="form-row">
            <app-select
              id="fieldType"
              label="Data Input Type"
              [required]="true"
              [options]="fieldTypeOptions"
              formControlName="fieldType">
            </app-select>

            <app-select
              id="applicablePropertyType"
              label="Applies To Property Type"
              [options]="propertyTypeOptions"
              formControlName="applicablePropertyType">
            </app-select>
          </div>

          <app-input
            id="displayOrder"
            type="number"
            label="Display Sequence Order"
            placeholder="e.g. 1"
            [required]="true"
            formControlName="displayOrder">
          </app-input>

          <app-input
            *ngIf="form.get('fieldType')?.value === FieldDataType.Selection"
            id="options"
            label="Selection Options (Comma Separated)"
            placeholder="e.g. 8GB, 16GB, 32GB"
            formControlName="options">
          </app-input>

          <div class="checkbox-row">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="isRequired" />
              <span>Mandatory Field (Validation Enforced)</span>
            </label>
          </div>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Create Field</app-button>
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
    .checkbox-row { margin: 1rem 0; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-primary); cursor: pointer; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `]
})
export class PropertyFieldModalComponent {
  private readonly fb = inject(FormBuilder);
  readonly FieldDataType = FieldDataType;

  @Input() isOpen = false;
  @Input() loading = false;

  saveField = output<CreatePropertyFieldRequest>();
  cancel = output<void>();

  readonly fieldTypeOptions: SelectOption[] = [
    { label: 'Text', value: FieldDataType.Text },
    { label: 'Number', value: FieldDataType.Number },
    { label: 'Date', value: FieldDataType.Date },
    { label: 'Boolean (Yes/No)', value: FieldDataType.Boolean },
    { label: 'Selection Dropdown', value: FieldDataType.Selection }
  ];

  readonly propertyTypeOptions: SelectOption[] = [
    { label: 'All Property Types', value: '' },
    { label: 'Fixed Asset Only', value: PropertyType.FixedAsset },
    { label: 'Consumable Only', value: PropertyType.Consumable }
  ];

  form = this.fb.group({
    fieldName: ['', Validators.required],
    fieldType: [FieldDataType.Text, Validators.required],
    isRequired: [false],
    applicablePropertyType: [''],
    displayOrder: [1, [Validators.required, Validators.min(1)]],
    options: ['']
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saveField.emit({
      fieldName: raw.fieldName || '',
      fieldType: Number(raw.fieldType),
      isRequired: !!raw.isRequired,
      applicablePropertyType: raw.applicablePropertyType ? Number(raw.applicablePropertyType) : undefined,
      displayOrder: Number(raw.displayOrder),
      options: raw.options || undefined
    });
    this.form.reset({ fieldType: FieldDataType.Text, displayOrder: 1 });
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
