import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = 0;
  private readonly isLoadingSignal = signal<boolean>(false);
  public readonly isLoading = this.isLoadingSignal.asReadonly();

  public show(): void {
    this.activeRequests++;
    this.isLoadingSignal.set(true);
  }

  public hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.isLoadingSignal.set(false);
    }
  }

  public reset(): void {
    this.activeRequests = 0;
    this.isLoadingSignal.set(false);
  }
}
