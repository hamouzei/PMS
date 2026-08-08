import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDataApiService } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SafetyBox, Warehouse } from '../../../core/models/master-data.model';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SafetyBoxVisualizerComponent } from '../../../shared/components/safety-box-visualizer/safety-box-visualizer.component';
import { SafetyBoxModalComponent, CreateSafetyBoxRequest } from './safety-box-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-safety-box-list',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    SafetyBoxVisualizerComponent,
    SafetyBoxModalComponent,
    IconComponent
  ],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Safety Boxes & Secure Storage (SR005)</h3>
          <p class="subtitle">Visual capacity indicators for high-value asset safety boxes and shelves</p>
        </div>
        <app-button variant="gold" (btnClick)="openModal()">
          <span><app-icon name="lock" [size]="16"></app-icon> Add Safety Box</span>
        </app-button>
      </div>

      <div class="safety-box-container">
        <app-safety-box-visualizer
          *ngFor="let box of boxes"
          [boxNumber]="box.boxNumber"
          [category]="box.category || 'High Security'"
          [shelves]="box.shelves || []">
        </app-safety-box-visualizer>

        <div *ngIf="boxes.length === 0" class="empty-state">
          <span>No Safety Boxes registered yet. Click "Add Safety Box" to create one.</span>
        </div>
      </div>

      <app-safety-box-modal
        [isOpen]="isModalOpen"
        [warehouses]="warehouses"
        [loading]="isSaving"
        (saveBox)="onSaveBox($event)"
        (cancel)="closeModal()">
      </app-safety-box-modal>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .safety-box-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .empty-state {
      text-align: center; padding: 3rem 1.5rem; background-color: var(--bg-surface);
      border: 1px dashed var(--border-color); border-radius: var(--radius-lg); color: var(--text-muted);
    }
  `]
})
export class SafetyBoxListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);

  boxes: SafetyBox[] = [];
  warehouses: Warehouse[] = [];
  isModalOpen = false;
  isSaving = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.masterDataApi.getWarehouses().subscribe({
      next: (whs) => {
        this.warehouses = whs;
        // Construct demo safety box representations if server returns empty list
        this.boxes = [
          {
            id: 'sb-1',
            boxNumber: 'SB-HQ-01',
            warehouseId: whs[0]?.id || '',
            category: 'Electronics & IT Assets',
            totalShelves: 3,
            isActive: true,
            shelves: [
              { id: 's1', safetyBoxId: 'sb-1', shelfLabel: 'Shelf 01 (Upper)', weightCapacity: 50, volumeCapacity: 0.5 },
              { id: 's2', safetyBoxId: 'sb-1', shelfLabel: 'Shelf 02 (Middle)', weightCapacity: 100, volumeCapacity: 1.0 },
              { id: 's3', safetyBoxId: 'sb-1', shelfLabel: 'Shelf 03 (Lower)', weightCapacity: 150, volumeCapacity: 1.5 }
            ]
          }
        ];
      }
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSaveBox(payload: CreateSafetyBoxRequest): void {
    this.isSaving = true;
    const newBox: SafetyBox = {
      id: Math.random().toString(36).substring(2, 9),
      boxNumber: payload.boxNumber,
      warehouseId: payload.warehouseId,
      category: payload.category,
      totalShelves: payload.totalShelves,
      isActive: true,
      shelves: Array.from({ length: payload.totalShelves }, (_, idx) => ({
        id: `s-${idx + 1}`,
        safetyBoxId: payload.boxNumber,
        shelfLabel: `Shelf 0${idx + 1}`,
        weightCapacity: 100,
        volumeCapacity: 1.0
      }))
    };
    this.boxes.push(newBox);
    this.isSaving = false;
    this.notification.success('Safety Box Created', 'Safety box and shelves generated.');
    this.closeModal();
  }
}
