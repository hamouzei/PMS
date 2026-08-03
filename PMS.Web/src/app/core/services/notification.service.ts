import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  public readonly toasts = this.toastsSignal.asReadonly();

  public show(title: string, message: string, type: ToastType = 'info', duration = 5000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, type, title, message, duration };

    this.toastsSignal.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  public success(title: string, message: string): void {
    this.show(title, message, 'success');
  }

  public error(title: string, message: string): void {
    this.show(title, message, 'error', 7000);
  }

  public warning(title: string, message: string): void {
    this.show(title, message, 'warning', 6000);
  }

  public info(title: string, message: string): void {
    this.show(title, message, 'info');
  }

  public dismiss(id: string): void {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
