import { Component, Input, output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/master-data.model';
import { CreateCategoryRequest } from '../../../core/services/master-data-api.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../../shared/components/select/select.component';

@Component({
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editCategory ? 'Edit Property Category' : 'Create New Category' }}</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <app-input
            id="name"
            label="Category Name"
            placeholder="e.g. IT Equipment & Laptops"
            [required]="true"
            formControlName="name">
          </app-input>

          <app-input
            id="description"
            label="Description"
            placeholder="Category scope and purpose"
            formControlName="description">
          </app-input>

          <app-select
            id="parentCategoryId"
            label="Parent Category (Optional)"
            placeholder="None (Top Level Category)"
            [options]="parentOptions"
            formControlName="parentCategoryId">
          </app-select>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="gold" [loading]="loading">Save Category</app-button>
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
      width: 100%; max-width: 480px;
      box-shadow: var(--shadow-lg);
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color);
      h3 { font-size: 1.125rem; font-weight: 600; margin: 0; }
    }
    .close-btn { font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `]
})
export class CategoryModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() editCategory: Category | null = null;
  @Input() categoriesList: Category[] = [];
  @Input() loading = false;

  saveCategory = output<CreateCategoryRequest>();
  cancel = output<void>();

  parentOptions: SelectOption[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    parentCategoryId: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriesList']) {
      this.parentOptions = this.categoriesList
        .filter((c) => !this.editCategory || c.id !== this.editCategory.id)
        .map((c) => ({ label: c.name, value: c.id }));
    }

    if (changes['editCategory'] && this.editCategory) {
      this.form.patchValue({
        name: this.editCategory.name,
        description: this.editCategory.description || '',
        parentCategoryId: this.editCategory.parentCategoryId || ''
      });
    } else if (!this.editCategory) {
      this.form.reset();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saveCategory.emit({
      name: raw.name || '',
      description: raw.description || undefined,
      parentCategoryId: raw.parentCategoryId || undefined
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
