import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDataApiService, CreateWarehouseRequest, CreateShelfLocationRequest } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ShelfLocation, Warehouse } from '../../../core/models/master-data.model';
import { ColumnDef, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { WarehouseModalComponent } from './warehouse-modal.component';
import { ShelfModalComponent } from './shelf-modal.component';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ButtonComponent,
    WarehouseModalComponent,
    ShelfModalComponent
  ],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Warehouses & Shelf Locations</h3>
          <p class="subtitle">Physical store facilities, shelf bins, and QR Code location tags</p>
        </div>
        <div class="btn-group">
          <app-button variant="secondary" (btnClick)="openShelfModal()">
            <span>🏷️ Add Shelf Location</span>
          </app-button>
          <app-button variant="gold" (btnClick)="openWarehouseModal()">
            <span>🏢 Add Warehouse</span>
          </app-button>
        </div>
      </div>

      <div class="section-title">Warehouses Facilities</div>
      <app-data-table
        [columns]="warehouseColumns"
        [data]="warehouses"
        [loading]="loading"
        [totalCount]="warehouses.length">
      </app-data-table>

      <div class="section-title">Shelf Locations & QR Codes</div>
      <app-data-table
        [columns]="shelfColumns"
        [data]="shelves"
        [loading]="loading"
        [totalCount]="shelves.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'qrCodeValue'" class="qr-code-pill">
              📱 {{ row.qrCodeValue }}
            </span>
            <span *ngSwitchCase="'warehouse'">
              {{ row.warehouse?.warehouseName || row.warehouseId || '-' }}
            </span>
            <span *ngSwitchDefault>{{ row[key] || '-' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>

      <app-warehouse-modal
        [isOpen]="isWarehouseModalOpen"
        [loading]="isSaving"
        (saveWarehouse)="onSaveWarehouse($event)"
        (cancel)="closeWarehouseModal()">
      </app-warehouse-modal>

      <app-shelf-modal
        [isOpen]="isShelfModalOpen"
        [warehouses]="warehouses"
        [loading]="isSaving"
        (saveShelf)="onSaveShelf($event)"
        (cancel)="closeShelfModal()">
      </app-shelf-modal>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .btn-group { display: flex; gap: 0.75rem; }
    .section-title { font-weight: 600; font-size: 1rem; color: var(--ecx-navy-primary); margin-top: 0.5rem; }
    .qr-code-pill {
      font-family: monospace; font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.5rem;
      background-color: var(--bg-surface-hover); border-radius: var(--radius-sm); border: 1px solid var(--border-color);
    }
  `]
})
export class WarehouseListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);

  warehouses: Warehouse[] = [];
  shelves: ShelfLocation[] = [];
  loading = false;
  isWarehouseModalOpen = false;
  isShelfModalOpen = false;
  isSaving = false;

  readonly warehouseColumns: ColumnDef<Warehouse>[] = [
    { key: 'locationCode', header: 'Code', sortable: true },
    { key: 'warehouseName', header: 'Facility Name', sortable: true },
    { key: 'locationType', header: 'Type' },
    { key: 'address', header: 'Address' }
  ];

  readonly shelfColumns: ColumnDef<ShelfLocation>[] = [
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'aisle', header: 'Aisle' },
    { key: 'rack', header: 'Rack' },
    { key: 'shelfNumber', header: 'Shelf' },
    { key: 'bin', header: 'Bin' },
    { key: 'qrCodeValue', header: 'QR Code Tag' },
    { key: 'capacity', header: 'Capacity' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.masterDataApi.getWarehouses().subscribe({
      next: (whs) => {
        this.warehouses = whs;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    this.masterDataApi.getShelves().subscribe({
      next: (shs) => { this.shelves = shs; }
    });
  }

  openWarehouseModal(): void {
    this.isWarehouseModalOpen = true;
  }

  closeWarehouseModal(): void {
    this.isWarehouseModalOpen = false;
  }

  openShelfModal(): void {
    this.isShelfModalOpen = true;
  }

  closeShelfModal(): void {
    this.isShelfModalOpen = false;
  }

  onSaveWarehouse(payload: CreateWarehouseRequest): void {
    this.isSaving = true;
    this.masterDataApi.createWarehouse(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Warehouse Created', 'Facility added successfully.');
        this.closeWarehouseModal();
        this.loadData();
      },
      error: () => { this.isSaving = false; }
    });
  }

  onSaveShelf(payload: CreateShelfLocationRequest): void {
    this.isSaving = true;
    this.masterDataApi.createShelf(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Shelf Created', 'Shelf location and QR code generated successfully.');
        this.closeShelfModal();
        this.loadData();
      },
      error: () => { this.isSaving = false; }
    });
  }
}
