import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryListComponent } from './categories/category-list.component';
import { ItemListComponent } from './items/item-list.component';
import { PropertyFieldsListComponent } from './property-fields/property-fields-list.component';
import { WarehouseListComponent } from './warehouses/warehouse-list.component';
import { SafetyBoxListComponent } from './safety-boxes/safety-box-list.component';
import { SupplierListComponent } from './suppliers/supplier-list.component';

export type MasterDataTab = 'items' | 'categories' | 'fields' | 'warehouses' | 'safety-boxes' | 'suppliers';

const VALID_TABS: ReadonlySet<string> = new Set<MasterDataTab>([
  'items', 'categories', 'fields', 'warehouses', 'safety-boxes', 'suppliers'
]);

@Component({
  selector: 'app-master-data-shell',
  standalone: true,
  imports: [
    CommonModule,
    CategoryListComponent,
    ItemListComponent,
    PropertyFieldsListComponent,
    WarehouseListComponent,
    SafetyBoxListComponent,
    SupplierListComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>Master Data & Configuration Engine</h2>
          <p class="subtitle">Manage system catalogs, categories, property schemas, and storage facilities</p>
        </div>
      </div>

      <nav class="tab-navigation">
        <button type="button" [class.active]="activeTab === 'items'" (click)="switchTab('items')">
          📦 Item Catalog
        </button>
        <button type="button" [class.active]="activeTab === 'categories'" (click)="switchTab('categories')">
          📁 Categories
        </button>
        <button type="button" [class.active]="activeTab === 'fields'" (click)="switchTab('fields')">
          ⚙️ Property Fields Schema
        </button>
        <button type="button" [class.active]="activeTab === 'warehouses'" (click)="switchTab('warehouses')">
          🏢 Warehouses & Shelves
        </button>
        <button type="button" [class.active]="activeTab === 'safety-boxes'" (click)="switchTab('safety-boxes')">
          🔒 Safety Boxes
        </button>
        <button type="button" [class.active]="activeTab === 'suppliers'" (click)="switchTab('suppliers')">
          🏢 Approved Suppliers
        </button>
      </nav>

      <div class="tab-body">
        <app-item-list *ngIf="activeTab === 'items'"></app-item-list>
        <app-category-list *ngIf="activeTab === 'categories'"></app-category-list>
        <app-property-fields-list *ngIf="activeTab === 'fields'"></app-property-fields-list>
        <app-warehouse-list *ngIf="activeTab === 'warehouses'"></app-warehouse-list>
        <app-safety-box-list *ngIf="activeTab === 'safety-boxes'"></app-safety-box-list>
        <app-supplier-list *ngIf="activeTab === 'suppliers'"></app-supplier-list>
      </div>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .tab-navigation {
      display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color);
      overflow-x: auto; padding-bottom: 2px;
      button {
        padding: 0.625rem 1rem; font-size: 0.875rem; font-weight: 500;
        color: var(--text-secondary); border-radius: var(--radius-md) var(--radius-md) 0 0;
        border: 1px solid transparent; cursor: pointer; transition: all var(--transition-fast);
        &:hover { color: var(--text-primary); background-color: var(--bg-surface-hover); }
        &.active {
          color: var(--ecx-navy-primary); font-weight: 600;
          background-color: var(--bg-surface); border-color: var(--border-color) var(--border-color) transparent;
        }
      }
    }
    .tab-body {
      background-color: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm);
    }
  `]
})
export class MasterDataShellComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  activeTab: MasterDataTab = 'items';

  ngOnInit(): void {
    const tabParam = this.route.snapshot.paramMap.get('tab');
    if (tabParam && VALID_TABS.has(tabParam)) {
      this.activeTab = tabParam as MasterDataTab;
    }
  }

  switchTab(tab: MasterDataTab): void {
    this.activeTab = tab;
    this.router.navigate(['/master-data', tab], { replaceUrl: true });
  }
}
