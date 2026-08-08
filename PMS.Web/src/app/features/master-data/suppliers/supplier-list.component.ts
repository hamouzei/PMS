import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MasterDataApiService, CreateSupplierRequest } from '../../../core/services/master-data-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Supplier } from '../../../core/models/master-data.model';
import { ColumnDef, DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ButtonComponent, InputComponent, IconComponent],
  template: `
    <div class="tab-content">
      <div class="content-header">
        <div>
          <h3>Approved Suppliers Directory (SR007)</h3>
          <p class="subtitle">Vendor directory for Goods Receiving Notes (GRN) and procurement matching</p>
        </div>
        <app-button variant="gold" (btnClick)="openModal()">
          <span><app-icon name="truck" [size]="16"></app-icon> Add Supplier</span>
        </app-button>
      </div>

      <app-data-table
        [columns]="columns"
        [data]="suppliers"
        [loading]="loading"
        [totalCount]="suppliers.length">
      </app-data-table>

      <div *ngIf="isModalOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Register Approved Vendor / Supplier</h3>
            <button type="button" class="close-btn" (click)="closeModal()">&times;</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
            <app-input
              id="supplierName"
              label="Supplier / Enterprise Name"
              placeholder="e.g. ECX Equipment Supplies PLC"
              [required]="true"
              formControlName="supplierName">
            </app-input>

            <div class="form-row">
              <app-input
                id="contactPerson"
                label="Contact Person"
                placeholder="e.g. Abebe Bikila"
                formControlName="contactPerson">
              </app-input>

              <app-input
                id="tinNumber"
                label="TIN Number"
                placeholder="e.g. 0049281048"
                formControlName="tinNumber">
              </app-input>
            </div>

            <div class="form-row">
              <app-input
                id="phoneNumber"
                label="Phone Number"
                placeholder="e.g. +251911000000"
                formControlName="phoneNumber">
              </app-input>

              <app-input
                id="email"
                type="email"
                label="Email Address"
                placeholder="e.g. vendor@domain.et"
                formControlName="email">
              </app-input>
            </div>

            <div class="modal-footer">
              <app-button type="button" variant="secondary" (btnClick)="closeModal()">Cancel</app-button>
              <app-button type="submit" variant="gold" [loading]="isSaving">Save Supplier</app-button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-content { display: flex; flex-direction: column; gap: 1.25rem; }
    .content-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-card {
      background-color: var(--bg-surface);
      border-radius: var(--radius-lg);
      width: 100%; max-width: 540px;
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
export class SupplierListComponent implements OnInit {
  private readonly masterDataApi = inject(MasterDataApiService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  suppliers: Supplier[] = [];
  loading = false;
  isModalOpen = false;
  isSaving = false;

  readonly columns: ColumnDef<Supplier>[] = [
    { key: 'supplierName', header: 'Supplier Name', sortable: true },
    { key: 'tinNumber', header: 'TIN Number' },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'phoneNumber', header: 'Phone' },
    { key: 'email', header: 'Email' }
  ];

  form = this.fb.group({
    supplierName: ['', Validators.required],
    contactPerson: [''],
    tinNumber: [''],
    phoneNumber: [''],
    email: ['', [Validators.email]]
  });

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.masterDataApi.getSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving = true;
    this.masterDataApi.createSupplier({
      supplierName: raw.supplierName || '',
      contactPerson: raw.contactPerson || undefined,
      tinNumber: raw.tinNumber || undefined,
      phoneNumber: raw.phoneNumber || undefined,
      email: raw.email || undefined
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Supplier Added', 'Vendor saved successfully.');
        this.closeModal();
        this.loadSuppliers();
      },
      error: () => { this.isSaving = false; }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }
}
