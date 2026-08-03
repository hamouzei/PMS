import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="'btn btn-' + variant + ' ' + (fullWidth ? 'w-full' : '')"
      (click)="onClick($event)">
      <span *ngIf="loading" class="spinner-sm"></span>
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
      cursor: pointer;
      border: 1px solid transparent;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background-color: var(--ecx-navy-primary);
      color: #ffffff;
      &:hover:not(:disabled) { background-color: var(--ecx-navy-light); }
    }

    .btn-gold {
      background-color: var(--ecx-gold-primary);
      color: #0F172A;
      font-weight: 600;
      &:hover:not(:disabled) { background-color: var(--ecx-gold-hover); }
    }

    .btn-secondary {
      background-color: var(--bg-surface);
      border-color: var(--border-color);
      color: var(--text-primary);
      &:hover:not(:disabled) { background-color: var(--bg-surface-hover); }
    }

    .btn-danger {
      background-color: var(--ecx-danger);
      color: #ffffff;
      &:hover:not(:disabled) { opacity: 0.9; }
    }

    .btn-ghost {
      background-color: transparent;
      color: var(--text-secondary);
      &:hover:not(:disabled) { background-color: var(--bg-surface-hover); color: var(--text-primary); }
    }

    .w-full { width: 100%; }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  btnClick = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
