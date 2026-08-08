import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterDataApiService, CreatePropertyFieldRequest } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FieldDataType, PropertyField, PropertyType } from '../../../core/models/master-data.model';
import { ColumnDef, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PropertyFieldModalComponent } from './property-field-modal.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-property-fields-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ButtonComponent, PropertyFieldModalComponent, IconComponent],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Dynamic Property Schema Fields (SR003)</h3>
          <p class="subtitle">Define custom specifications, serial numbers, and attributes per property type</p>
        </div>
        <app-button variant="gold" (btnClick)="openModal()">
          <span><app-icon name="plus" [size]="16"></app-icon> Add Schema Field</span>
        </app-button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="fields"
        [loading]="loading"
        [totalCount]="fields.length">
        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'fieldType'">
              {{ getFieldTypeName(row.fieldType) }}
            </span>
            <span *ngSwitchCase="'applicablePropertyType'">
              {{ getPropertyTypeName(row.applicablePropertyType) }}
            </span>
            <span *ngSwitchCase="'isRequired'" [class]="'req-badge ' + (row.isRequired ? 'required' : 'optional')">
              {{ row.isRequired ? 'Mandatory' : 'Optional' }}
            </span>
            <span *ngSwitchDefault>{{ row[key] || '-' }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>

      <app-property-field-modal
        [isOpen]="isModalOpen"
        [loading]="isSaving"
        (saveField)="onSaveField($event)"
        (cancel)="closeModal()">
      </app-property-field-modal>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .req-badge {
      font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 9999px;
      &.required { background-color: var(--ecx-danger-bg); color: #991B1B; }
      &.optional { background-color: var(--bg-surface-hover); color: var(--text-secondary); }
    }
  `]
})
export class PropertyFieldsListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);

  fields: PropertyField[] = [];
  loading = false;
  isModalOpen = false;
  isSaving = false;

  readonly columns: ColumnDef<PropertyField>[] = [
    { key: 'displayOrder', header: 'Order', sortable: true },
    { key: 'fieldName', header: 'Field Label', sortable: true },
    { key: 'fieldType', header: 'Input Type' },
    { key: 'applicablePropertyType', header: 'Applies To' },
    { key: 'isRequired', header: 'Validation' }
  ];

  ngOnInit(): void {
    this.loadFields();
  }

  loadFields(): void {
    this.loading = true;
    this.masterDataApi.getPropertyFields().subscribe({
      next: (data) => {
        this.fields = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getFieldTypeName(type: FieldDataType | number): string {
    return FieldDataType[Number(type)] || String(type);
  }

  getPropertyTypeName(type?: PropertyType | number): string {
    if (!type) return 'All Types';
    return PropertyType[Number(type)] || String(type);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  onSaveField(payload: CreatePropertyFieldRequest): void {
    this.isSaving = true;
    this.masterDataApi.createPropertyField(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Field Created', 'Custom property schema field added successfully.');
        this.closeModal();
        this.loadFields();
      },
      error: () => { this.isSaving = false; }
    });
  }
}
