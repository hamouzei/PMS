import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDataApiService, CreateItemRequest } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Category, ItemMaster, PropertyField } from '../../../core/models/master-data.model';
import { ColumnDef, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PropertyTypePipe } from '../../../shared/pipes/property-type.pipe';
import { CurrencyFormatterPipe } from '../../../shared/pipes/currency-formatter.pipe';
import { ItemModalComponent } from './item-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ButtonComponent,
    PropertyTypePipe,
    CurrencyFormatterPipe,
    ItemModalComponent,
    IconComponent
  ],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Item Master Catalog</h3>
          <p class="subtitle">Central repository of fixed assets and consumable inventory definitions</p>
        </div>
        <app-button variant="gold" (btnClick)="openCreateModal()">
          <span><app-icon name="plus" [size]="16"></app-icon> Add New Item</span>
        </app-button>
      </div>

      <div class="search-bar">
        <input
          type="text"
          placeholder="Search by SKU, item description, category, or unit of measure..."
          [value]="searchQuery"
          (input)="onSearch($event)"
          class="search-input" />
      </div>

      <app-data-table
        [columns]="columns"
        [data]="filteredItems"
        [loading]="loading"
        [currentPage]="pageNumber"
        [pageSize]="pageSize"
        [totalCount]="filteredItems.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'propertyType'" [class]="'type-pill ' + (row.propertyType === 1 ? 'asset' : 'consumable')">
              {{ row.propertyType | propertyType }}
            </span>
            <span *ngSwitchCase="'category'">
              {{ row.category?.name || '-' }}
            </span>
            <span *ngSwitchCase="'unitCost'">
              {{ row.unitCost | etbCurrency }}
            </span>
            <span *ngSwitchCase="'requiresInspection'">
              {{ row.requiresInspection ? 'Required' : 'None' }}
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

      <app-item-modal
        [isOpen]="isModalOpen"
        [editItem]="selectedItem"
        [categories]="categories"
        [propertyFields]="propertyFields"
        [loading]="isSaving"
        (saveItem)="onSaveItem($event)"
        (cancel)="closeModal()">
      </app-item-modal>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .search-input {
      width: 100%; max-width: 440px; padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background-color: var(--bg-surface); color: var(--text-primary); font-size: 0.875rem;
    }
    .type-pill {
      font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 9999px;
      &.asset { background-color: var(--ecx-info-bg); color: #1E40AF; }
      &.consumable { background-color: var(--ecx-warning-bg); color: #92400E; }
    }
    .btn-icon {
      padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm);
      background-color: var(--bg-surface-hover); border: 1px solid var(--border-color); cursor: pointer;
    }
  `]
})
export class ItemListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);

  items: ItemMaster[] = [];
  filteredItems: ItemMaster[] = [];
  categories: Category[] = [];
  propertyFields: PropertyField[] = [];
  loading = false;
  searchQuery = '';
  pageNumber = 1;
  pageSize = 10;

  isModalOpen = false;
  selectedItem: ItemMaster | null = null;
  isSaving = false;

  readonly columns: ColumnDef<ItemMaster>[] = [
    { key: 'sku', header: 'SKU Code', sortable: true },
    { key: 'itemName', header: 'Item Description', sortable: true },
    { key: 'category', header: 'Category' },
    { key: 'propertyType', header: 'Property Type', sortable: true },
    { key: 'unitOfMeasure', header: 'UoM' },
    { key: 'minStockLevel', header: 'Min Stock' },
    { key: 'unitCost', header: 'Est. Unit Cost', sortable: true },
    { key: 'requiresInspection', header: 'Inspection' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.masterDataApi.getItems().subscribe({
      next: (data) => {
        this.items = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.masterDataApi.getCategories().subscribe({
      next: (cats) => { this.categories = cats; }
    });

    this.masterDataApi.getPropertyFields().subscribe({
      next: (pfs) => { this.propertyFields = pfs; }
    });
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(
        (i) =>
          i.itemName.toLowerCase().includes(this.searchQuery) ||
          i.sku.toLowerCase().includes(this.searchQuery) ||
          (i.category && i.category.name.toLowerCase().includes(this.searchQuery))
      );
    }
  }

  openCreateModal(): void {
    this.selectedItem = null;
    this.isModalOpen = true;
  }

  openEditModal(item: ItemMaster): void {
    this.selectedItem = item;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedItem = null;
  }

  onSaveItem(payload: CreateItemRequest): void {
    this.isSaving = true;
    if (this.selectedItem) {
      this.masterDataApi.updateItem(this.selectedItem.id, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Item Updated', 'Item catalog record updated successfully.');
          this.closeModal();
          this.loadData();
        },
        error: () => { this.isSaving = false; }
      });
    } else {
      this.masterDataApi.createItem(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('Item Created', 'New item master registered successfully.');
          this.closeModal();
          this.loadData();
        },
        error: () => { this.isSaving = false; }
      });
    }
  }
}
