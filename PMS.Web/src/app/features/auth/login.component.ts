import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, IconComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand-header">
          <div class="logo-badge">ECX PAS</div>
          <h2>Property Automation</h2>
          <p>Sign in with your employee credentials</p>
        </div>

        <div *ngIf="lockoutMessage" class="lockout-alert">
          <span class="alert-icon"><app-icon name="lock" [size]="20"></app-icon></span>
          <div class="alert-content">
            <strong>Account Locked</strong>
            <span>{{ lockoutMessage }}</span>
          </div>
        </div>

        <div *ngIf="generalError" class="error-alert">
          <span>{{ generalError }}</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <app-input
            id="employeeId"
            label="Employee ID"
            placeholder="e.g. PAS-ADMIN"
            [required]="true"
            [errorMessage]="getFieldError('employeeId')"
            formControlName="employeeId">
          </app-input>

          <app-input
            id="userName"
            label="Username"
            placeholder="e.g. admin"
            [required]="true"
            [errorMessage]="getFieldError('userName')"
            formControlName="userName">
          </app-input>

          <app-input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            [required]="true"
            [errorMessage]="getFieldError('password')"
            formControlName="password">
          </app-input>

          <app-button
            type="submit"
            variant="gold"
            [fullWidth]="true"
            [loading]="loading">
            Sign In
          </app-button>
        </form>

        <div class="demo-credentials-note">
          <p><strong>Database Seed Accounts (Password: Pass&#64;123):</strong></p>
          <div class="demo-chips">
            <span (click)="fillDemo('PAS-ADMIN', 'admin')" title="Property Admin">Admin</span>
            <span (click)="fillDemo('PAS-STORE', 'storekeeper')" title="Central Storekeeper">Storekeeper</span>
            <span (click)="fillDemo('PAS-REQ', 'requester')" title="Requisitioning Staff">Requisitioner</span>
            <span (click)="fillDemo('PAS-MGR', 'manager')" title="Department Manager">Dept Manager</span>
            <span (click)="fillDemo('PAS-INSP', 'inspector')" title="Inspection Officer">Inspector</span>
            <span (click)="fillDemo('PAS-COMP', 'compliance')" title="Compliance Officer">Compliance</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--ecx-navy-dark) 0%, var(--ecx-navy-primary) 100%);
      padding: 1.5rem;
    }
    .login-card {
      background-color: var(--bg-surface);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      width: 100%; max-width: 440px;
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-color);
    }
    .brand-header {
      text-align: center; margin-bottom: 2rem;
      .logo-badge {
        display: inline-block;
        background-color: var(--ecx-gold-primary);
        color: #0F172A;
        font-weight: 800; font-size: 0.875rem;
        padding: 0.25rem 0.75rem; border-radius: 9999px;
        margin-bottom: 0.75rem;
      }
      h2 { color: var(--ecx-navy-primary); font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
      p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
    }
    .lockout-alert {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background-color: var(--ecx-danger-bg);
      border: 1px solid var(--ecx-danger);
      border-radius: var(--radius-md);
      padding: 0.875rem; margin-bottom: 1.25rem;
      color: #991B1B; font-size: 0.8125rem;
      .alert-icon { font-size: 1.25rem; }
      .alert-content { display: flex; flex-direction: column; }
    }
    .error-alert {
      background-color: var(--ecx-danger-bg);
      color: #991B1B;
      padding: 0.75rem; border-radius: var(--radius-md);
      font-size: 0.8125rem; margin-bottom: 1.25rem;
    }
    .demo-credentials-note {
      margin-top: 2rem; padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem; color: var(--text-secondary);
      p { margin-bottom: 0.5rem; }
    }
    .demo-chips {
      display: flex; flex-wrap: wrap; gap: 0.375rem;
      span {
        background-color: var(--bg-surface-hover);
        padding: 0.25rem 0.5rem; border-radius: var(--radius-sm);
        cursor: pointer; font-size: 0.6875rem; font-weight: 500;
        border: 1px solid var(--border-color);
        &:hover { background-color: var(--ecx-gold-light); color: #92400E; border-color: var(--ecx-gold-primary); }
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  loading = false;
  lockoutMessage: string | null = null;
  generalError: string | null = null;

  form = this.fb.nonNullable.group({
    employeeId: ['PAS-ADMIN', Validators.required],
    userName: ['admin', Validators.required],
    password: ['Pass@123', Validators.required]
  });

  getFieldError(fieldName: 'employeeId' | 'userName' | 'password'): string {
    const control = this.form.get(fieldName);
    if (control && control.touched && control.invalid) {
      if (control.errors?.['required']) return `${fieldName === 'employeeId' ? 'Employee ID' : fieldName === 'userName' ? 'Username' : 'Password'} is required`;
    }
    return '';
  }

  fillDemo(employeeId: string, userName: string): void {
    this.form.patchValue({
      employeeId,
      userName,
      password: 'Pass@123'
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.lockoutMessage = null;
    this.generalError = null;

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('Welcome to ECX PAS', 'Authenticated successfully.');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401 && err.error?.error?.includes('locked')) {
          this.lockoutMessage = err.error.error;
        } else if (err.error?.error) {
          this.generalError = err.error.error;
        } else {
          this.generalError = 'Invalid Employee ID, Username, or Password.';
        }
      }
    });
  }
}
