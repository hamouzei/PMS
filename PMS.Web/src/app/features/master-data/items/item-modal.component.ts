import { Component, Input, output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, ItemMaster, PropertyField, PropertyType } from '../../../core/models/master-data.model';
import { CreateItemRequest } from '../../../core/services/master-data-api.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-item-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editItem ? 'Edit Item Master Record' : 'Register New Item Master' }}</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-row">
            <app-input
              id="sku"
              label="SKU Code"
              placeholder="e.g. FA-LAP-002"
              [required]="true"
              formControlName="sku">
            </app-input>

            <app-select
              id="propertyType"
              label="Property Classification"
              [required]="true"
              [options]="propertyTypeOptions"
              formControlName="propertyType">
            </app-select>
          </div>

          <app-input
            id="itemName"
            label="Item Description / Name"
            placeholder="e.g. Dell Latitude 5440 i7 16GB"
            [required]="true"
            formControlName="itemName">
          </app-input>

          <div class="form-row">
            <app-select
              id="categoryId"
              label="Category"
              [required]="true"
              [options]="categoryOptions"
              formControlName="categoryId">
            </app-select>

            <app-input
              id="unitOfMeasure"
              label="Unit of Measure (UoM)"
              placeholder="e.g. PCS, REAM, BOX, SET"
              [required]="true"
              formControlName="unitOfMeasure">
            </app-input>
          </div>

          <div class="form-row">
            <app-input
              id="minStockLevel"
              type="number"
              label="Minimum Stock Alert Level"
              placeholder="e.g. 5"
              [required]="true"
              formControlName="minStockLevel">
            </app-input>

            <app-input
              id="unitCost"
              type="number"
              label="Estimated Unit Cost (ETB)"
              placeholder="e.g. 85000"
              [required]="true"
              formControlName="unitCost">
            </app-input>
          </div>

          <div class="checkbox-row">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="requiresInspection" />
              <span>Requires Quality Inspection on Receiving (GRN)</span>
            </label>
          </div>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Save Item</app-button>
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
      width: 100%; max-width: 640px;
      box-shadow: var(--shadow-lg);
      max-height: 90vh; overflow-y: auto;
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
export class ItemModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() editItem: ItemMaster | null = null;
  @Input() categories: Category[] = [];
  @Input() propertyFields: PropertyField[] = [];
  @Input() loading = false;

  saveItem = output<CreateItemRequest>();
  cancel = output<void>();

  categoryOptions: SelectOption[] = [];
  readonly propertyTypeOptions: SelectOption[] = [
    { label: 'Fixed Asset', value: PropertyType.FixedAsset },
    { label: 'Consumable', value: PropertyType.Consumable }
  ];

  form = this.fb.group({
    sku: ['', Validators.required],
    itemName: ['', Validators.required],
    description: [''],
    categoryId: ['', Validators.required],
    propertyType: [PropertyType.FixedAsset, Validators.required],
    unitOfMeasure: ['PCS', Validators.required],
    requiresInspection: [true],
    minStockLevel: [1, [Validators.required, Validators.min(0)]],
    unitCost: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categories']) {
      this.categoryOptions = this.categories.map((c) => ({ label: c.name, value: c.id }));
    }

    if (changes['editItem'] && this.editItem) {
      this.form.patchValue({
        sku: this.editItem.sku,
        itemName: this.editItem.itemName,
        description: this.editItem.description || '',
        categoryId: this.editItem.categoryId,
        propertyType: this.editItem.propertyType,
        unitOfMeasure: this.editItem.unitOfMeasure,
        requiresInspection: this.editItem.requiresInspection,
        minStockLevel: this.editItem.minStockLevel,
        unitCost: this.editItem.unitCost
      });
    } else if (!this.editItem) {
      this.form.reset({
        propertyType: PropertyType.FixedAsset,
        unitOfMeasure: 'PCS',
        requiresInspection: true,
        minStockLevel: 1,
        unitCost: 0
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saveItem.emit({
      sku: raw.sku || '',
      itemName: raw.itemName || '',
      description: raw.description || undefined,
      categoryId: raw.categoryId || '',
      propertyType: Number(raw.propertyType),
      unitOfMeasure: raw.unitOfMeasure || 'PCS',
      requiresInspection: !!raw.requiresInspection,
      minStockLevel: Number(raw.minStockLevel),
      unitCost: Number(raw.unitCost)
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
