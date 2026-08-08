import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDataApiService, CreateCategoryRequest } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category } from '../../../core/models/master-data.model';
import { ColumnDef, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { CategoryModalComponent } from './category-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ButtonComponent, CategoryModalComponent, IconComponent],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Property Categories</h3>
          <p class="subtitle">Organize property and item master catalog into logical hierarchy</p>
        </div>
        <app-button variant="gold" (btnClick)="openCreateModal()">
          <span><app-icon name="plus" [size]="16"></app-icon> Add Category</span>
        </app-button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="categories"
        [loading]="loading"
        [totalCount]="categories.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'parentCategory'">
              {{ row.parentCategory?.name || row.parentCategoryId || '-' }}
            </span>
            <span *ngSwitchDefault>{{ row[key] || '-' }}</span>
          </ng-container>
        </ng-template>

        <ng-template #actionsTemplate let-row>
          <button type="button" class="btn-icon" (click)="openEditModal(row)">
            <app-icon name="edit" [size]="14"></app-icon> Edit
          </button>
        </ng-template>
      </app-data-table>

      <app-category-modal
        [isOpen]="isModalOpen"
        [editCategory]="selectedCategory"
        [categoriesList]="categories"
        [loading]="isSaving"
        (saveCategory)="onSaveCategory($event)"
        (cancel)="closeModal()">
      </app-category-modal>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .btn-icon {
      padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm);
      background-color: var(--bg-surface-hover); border: 1px solid var(--border-color); cursor: pointer;
    }
  `]
})
export class CategoryListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);

  categories: Category[] = [];
  loading = false;
  isModalOpen = false;
  selectedCategory: Category | null = null;
  isSaving = false;

  readonly columns: ColumnDef<Category>[] = [
    { key: 'name', header: 'Category Name', sortable: true },
    { key: 'description', header: 'Description' },
    { key: 'parentCategory', header: 'Parent Category' },
    { key: 'createdDate', header: 'Date Created', sortable: true }
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.masterDataApi.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openCreateModal(): void {
    this.selectedCategory = null;
    this.isModalOpen = true;
  }

  openEditModal(category: Category): void {
    this.selectedCategory = category;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCategory = null;
  }

  onSaveCategory(payload: CreateCategoryRequest): void {
    this.isSaving = true;
    if (this.selectedCategory) {
      this.masterDataApi.updateCategory(this.selectedCategory.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Category Updated', 'Category updated successfully.');
          this.closeModal();
          this.loadCategories();
        },
        error: () => { this.isSaving = false; }
      });
    } else {
      this.masterDataApi.createCategory(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Category Created', 'Category created successfully.');
          this.closeModal();
          this.loadCategories();
        },
        error: () => { this.isSaving = false; }
      });
    }
  }
}
