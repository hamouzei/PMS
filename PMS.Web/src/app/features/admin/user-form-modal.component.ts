import { Component, Input, output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppUserDto, CreateUserRequest, UpdateUserRequest, UserRole } from '../../core/models/user.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SelectComponent, SelectOption } from '../../shared/components/select/select.component';

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, SelectComponent],
  template: `
    <div *ngIf="isOpen" class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ isEditMode ? 'Edit User Profile' : 'Create New System User' }}</h3>
          <button type="button" class="close-btn" (click)="onCancel()">&times;</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="form-row">
            <app-input
              id="employeeId"
              label="Employee ID"
              placeholder="e.g. EMP-010"
              [required]="!isEditMode"
              [disabled]="isEditMode"
              formControlName="employeeId">
            </app-input>

            <app-input
              id="userName"
              label="Username"
              placeholder="e.g. jdoe"
              [required]="!isEditMode"
              [disabled]="isEditMode"
              formControlName="userName">
            </app-input>
          </div>

          <app-input
            id="fullName"
            label="Full Name"
            placeholder="Enter employee full name"
            [required]="true"
            formControlName="fullName">
          </app-input>

          <app-input
            *ngIf="!isEditMode"
            id="password"
            type="password"
            label="Initial Password"
            placeholder="••••••••"
            [required]="true"
            formControlName="password">
          </app-input>

          <div class="form-row">
            <app-select
              id="role"
              label="Assigned Role"
              [required]="true"
              [options]="roleOptions"
              formControlName="role">
            </app-select>

            <app-input
              id="department"
              label="Department"
              placeholder="e.g. IT & Infrastructure"
              formControlName="department">
            </app-input>
          </div>

          <div class="form-row">
            <app-input
              id="division"
              label="Division"
              placeholder="e.g. Software Dev"
              formControlName="division">
            </app-input>

            <app-input
              id="location"
              label="Location"
              placeholder="e.g. Head Office"
              formControlName="location">
            </app-input>
          </div>

          <app-input
            id="title"
            label="Job Title"
            placeholder="e.g. Senior Specialist"
            formControlName="title">
          </app-input>

          <div class="modal-footer">
            <app-button type="button" variant="secondary" (btnClick)="onCancel()">Cancel</app-button>
            <app-button type="submit" variant="primary" [loading]="loading">
              {{ isEditMode ? 'Save Changes' : 'Create User' }}
            </app-button>
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
      width: 100%; max-width: 600px;
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
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
  `]
})
export class UserFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() editUser: AppUserDto | null = null;
  @Input() loading = false;

  saveUser = output<CreateUserRequest | UpdateUserRequest>();
  cancel = output<void>();

  get isEditMode(): boolean {
    return !!this.editUser;
  }

  readonly roleOptions: SelectOption[] = Object.keys(UserRole)
    .filter((k) => isNaN(Number(k)))
    .map((roleName) => ({
      label: roleName.replace(/([A-Z])/g, ' $1').trim(),
      value: UserRole[roleName as keyof typeof UserRole]
    }));

  form = this.fb.group({
    employeeId: ['', Validators.required],
    userName: ['', Validators.required],
    fullName: ['', Validators.required],
    password: [''],
    role: [UserRole.Employee, Validators.required],
    department: [''],
    division: [''],
    location: [''],
    title: ['']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editUser'] && this.editUser) {
      this.form.patchValue({
        employeeId: this.editUser.employeeId,
        userName: this.editUser.userName,
        fullName: this.editUser.fullName,
        role: this.editUser.role,
        department: this.editUser.department || '',
        division: this.editUser.division || '',
        location: this.editUser.location || '',
        title: this.editUser.title || ''
      });
      this.form.get('password')?.clearValidators();
    } else if (!this.editUser) {
      this.form.reset({ role: UserRole.Employee });
      this.form.get('password')?.setValidators([Validators.required]);
    }
    this.form.get('password')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.isEditMode) {
      const updatePayload: UpdateUserRequest = {
        fullName: raw.fullName || '',
        role: Number(raw.role) as UserRole,
        department: raw.department || undefined,
        division: raw.division || undefined,
        location: raw.location || undefined,
        title: raw.title || undefined
      };
      this.saveUser.emit(updatePayload);
    } else {
      const createPayload: CreateUserRequest = {
        employeeId: raw.employeeId || '',
        userName: raw.userName || '',
        fullName: raw.fullName || '',
        password: raw.password || '',
        role: Number(raw.role) as UserRole,
        department: raw.department || undefined,
        division: raw.division || undefined,
        location: raw.location || undefined,
        title: raw.title || undefined
      };
      this.saveUser.emit(createPayload);
    }
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
