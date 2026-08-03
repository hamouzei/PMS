import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../core/services/admin-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppUserDto, CreateUserRequest, UserRole, UpdateUserRequest } from '../../core/models/user.model';
import { ColumnDef, DataTableComponent } from '../../shared/components/data-table/data-table.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { UserFormModalComponent } from './user-form-modal.component';
import { ResetPasswordModalComponent } from './reset-password-modal.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    ButtonComponent,
    UserFormModalComponent,
    ResetPasswordModalComponent
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>User Administration</h2>
          <p class="subtitle">Manage user accounts, assigned system roles, and credentials</p>
        </div>
        <app-button variant="gold" (btnClick)="openCreateModal()">
          <span>➕ Create New User</span>
        </app-button>
      </div>

      <div class="filter-bar">
        <input
          type="text"
          placeholder="Search users by name, employee ID, username, or department..."
          [value]="searchQuery"
          (input)="onSearch($event)"
          class="search-input" />
      </div>

      <app-data-table
        [columns]="columns"
        [data]="filteredUsers"
        [loading]="loading"
        [currentPage]="pageNumber"
        [pageSize]="pageSize"
        [totalCount]="filteredUsers.length">

        <ng-template #cellTemplate let-row let-key="key">
          <ng-container [ngSwitch]="key">
            <span *ngSwitchCase="'role'" [class]="'role-badge role-' + getRoleName(row.role).toLowerCase()">
              {{ getRoleName(row.role) }}
            </span>
            <span *ngSwitchCase="'isActive'" [class]="'status-indicator ' + (row.isActive ? 'active' : 'inactive')">
              {{ row.isActive ? 'Active' : 'Inactive' }}
            </span>
            <span *ngSwitchDefault>{{ row[key] || '-' }}</span>
          </ng-container>
        </ng-template>

        <ng-template #actionsTemplate let-row>
          <div class="action-buttons">
            <button type="button" class="btn-icon" (click)="openEditModal(row)" title="Edit User Profile">✏️ Edit</button>
            <button type="button" class="btn-icon danger" (click)="openResetModal(row)" title="Reset Password">🔑 Password</button>
            <button type="button" class="btn-icon toggle" (click)="toggleActiveState(row)" title="Toggle Status">
              {{ row.isActive ? '🚫 Deactivate' : '✅ Activate' }}
            </button>
          </div>
        </ng-template>
      </app-data-table>

      <!-- User Create/Edit Modal -->
      <app-user-form-modal
        [isOpen]="isFormModalOpen"
        [editUser]="selectedUser"
        [loading]="isSaving"
        (saveUser)="onSaveUser($event)"
        (cancel)="closeFormModal()">
      </app-user-form-modal>

      <!-- Password Reset Modal -->
      <app-reset-password-modal
        [isOpen]="isResetModalOpen"
        [targetUser]="selectedUser"
        [loading]="isSaving"
        (resetPassword)="onResetPassword($event)"
        (cancel)="closeResetModal()">
      </app-reset-password-modal>
    </div>
  `,
  styles: [`
    .page-container { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; align-items: center; justify-content: space-between; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .filter-bar { display: flex; gap: 1rem; }
    .search-input {
      flex: 1; max-width: 480px; padding: 0.625rem 0.875rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-md);
      background-color: var(--bg-surface); color: var(--text-primary); font-size: 0.875rem;
    }
    .role-badge {
      display: inline-block; padding: 0.2rem 0.5rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 600; text-transform: capitalize;
      background-color: var(--bg-surface-hover); color: var(--text-primary);
    }
    .status-indicator {
      font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 9999px;
      &.active { background-color: var(--ecx-success-bg); color: #065F46; }
      &.inactive { background-color: var(--ecx-danger-bg); color: #991B1B; }
    }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-icon {
      padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: var(--radius-sm);
      background-color: var(--bg-surface-hover); color: var(--text-primary);
      border: 1px solid var(--border-color); cursor: pointer;
      &.danger { color: var(--ecx-danger); }
      &.toggle { color: var(--ecx-info); }
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notification = inject(NotificationService);

  users: AppUserDto[] = [];
  filteredUsers: AppUserDto[] = [];
  loading = false;
  searchQuery = '';
  pageNumber = 1;
  pageSize = 10;

  isFormModalOpen = false;
  isResetModalOpen = false;
  selectedUser: AppUserDto | null = null;
  isSaving = false;

  readonly columns: ColumnDef<AppUserDto>[] = [
    { key: 'employeeId', header: 'Employee ID', sortable: true },
    { key: 'userName', header: 'Username', sortable: true },
    { key: 'fullName', header: 'Full Name', sortable: true },
    { key: 'role', header: 'System Role', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'isActive', header: 'Status', sortable: true }
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminApi.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    this.applyFilter();
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(this.searchQuery) ||
          u.employeeId.toLowerCase().includes(this.searchQuery) ||
          u.userName.toLowerCase().includes(this.searchQuery) ||
          (u.department && u.department.toLowerCase().includes(this.searchQuery))
      );
    }
  }

  getRoleName(roleEnum: UserRole | number): string {
    const roleNum = Number(roleEnum);
    return UserRole[roleNum] || String(roleEnum);
  }

  openCreateModal(): void {
    this.selectedUser = null;
    this.isFormModalOpen = true;
  }

  openEditModal(user: AppUserDto): void {
    this.selectedUser = user;
    this.isFormModalOpen = true;
  }

  closeFormModal(): void {
    this.isFormModalOpen = false;
    this.selectedUser = null;
  }

  openResetModal(user: AppUserDto): void {
    this.selectedUser = user;
    this.isResetModalOpen = true;
  }

  closeResetModal(): void {
    this.isResetModalOpen = false;
    this.selectedUser = null;
  }

  onSaveUser(payload: CreateUserRequest | UpdateUserRequest): void {
    this.isSaving = true;
    if (this.selectedUser) {
      this.adminApi.updateUser(this.selectedUser.id, payload as UpdateUserRequest).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('User Updated', 'User profile saved successfully.');
          this.closeFormModal();
          this.loadUsers();
        },
        error: () => { this.isSaving = false; }
      });
    } else {
      this.adminApi.createUser(payload as CreateUserRequest).subscribe({
        next: () => {
          this.isSaving = false;
          this.notification.success('User Created', 'New user registered successfully.');
          this.closeFormModal();
          this.loadUsers();
        },
        error: () => { this.isSaving = false; }
      });
    }
  }

  onResetPassword(newPassword: string): void {
    if (!this.selectedUser) return;
    this.isSaving = true;
    this.adminApi.resetPassword(this.selectedUser.id, { newPassword }).subscribe({
      next: () => {
        this.isSaving = false;
        this.notification.success('Password Reset', 'Password reset successfully.');
        this.closeResetModal();
      },
      error: () => { this.isSaving = false; }
    });
  }

  toggleActiveState(user: AppUserDto): void {
    const nextState = !user.isActive;
    this.adminApi.updateUser(user.id, { isActive: nextState }).subscribe({
      next: () => {
        this.notification.info(
          'User Status Changed',
          `User ${user.fullName} is now ${nextState ? 'Active' : 'Inactive'}.`
        );
        this.loadUsers();
      }
    });
  }
}
