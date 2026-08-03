import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-wrapper">
      <label *ngIf="label" [for]="id" class="select-label">
        {{ label }} <span *ngIf="required" class="required-star">*</span>
      </label>
      <select
        [id]="id"
        [disabled]="disabled"
        [value]="value"
        (change)="onSelectChange($event)"
        (blur)="onTouched()"
        class="select-field"
        [class.has-error]="!!errorMessage">
        <option value="" disabled selected>{{ placeholder || 'Select an option' }}</option>
        <option *ngFor="let opt of options" [value]="opt.value">{{ opt.label }}</option>
      </select>
      <span *ngIf="errorMessage" class="error-text">{{ errorMessage }}</span>
    </div>
  `,
  styles: [`
    .select-wrapper { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
    .select-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
    .required-star { color: var(--ecx-danger); }
    .select-field {
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--bg-surface);
      color: var(--text-primary);
      outline: none;
      &:focus { border-color: var(--border-focus); }
      &.has-error { border-color: var(--ecx-danger); }
      &:disabled { background-color: var(--bg-surface-hover); cursor: not-allowed; }
    }
    .error-text { font-size: 0.75rem; color: var(--ecx-danger); }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() id = 'select-' + Math.random().toString(36).substring(2, 7);
  @Input() label = '';
  @Input() placeholder = '';
  @Input() options: SelectOption[] = [];
  @Input() required = false;
  @Input() errorMessage = '';

  value: string | number = '';
  disabled = false;

  onChange: (value: string | number) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | number): void {
    this.value = value !== undefined && value !== null ? value : '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.value = val;
    this.onChange(val);
  }
}
