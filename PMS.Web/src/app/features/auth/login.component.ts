import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="brand-header">
          <h2>ECX Property Automation</h2>
          <p>Sign in to your account</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <app-input
            id="employeeId"
            label="Employee ID"
            placeholder="e.g. EMP-001"
            [required]="true"
            formControlName="employeeId">
          </app-input>

          <app-input
            id="userName"
            label="Username"
            placeholder="e.g. jdoe"
            [required]="true"
            formControlName="userName">
          </app-input>

          <app-input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            [required]="true"
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
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background-color: var(--ecx-navy-dark);
      padding: 1.5rem;
    }
    .login-card {
      background-color: var(--bg-surface);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      width: 100%; max-width: 420px;
      box-shadow: var(--shadow-lg);
    }
    .brand-header {
      text-align: center; margin-bottom: 2rem;
      h2 { color: var(--ecx-navy-primary); font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
      p { color: var(--text-secondary); font-size: 0.875rem; }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  loading = false;

  form = this.fb.nonNullable.group({
    employeeId: ['', Validators.required],
    userName: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.notification.success('Welcome Back', 'Signed in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
