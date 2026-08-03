import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-scanner-wrapper">
      <div class="qr-header">
        <span class="qr-title">{{ title }}</span>
        <button type="button" class="toggle-btn" (click)="toggleScan()">
          {{ isScanning ? 'Stop Camera' : 'Start Camera Scan' }}
        </button>
      </div>

      <div *ngIf="isScanning" class="camera-viewport">
        <div class="scanner-laser"></div>
        <span class="viewfinder-text">Align QR code within frame</span>
      </div>

      <div class="manual-input-bar">
        <input
          #qrInput
          type="text"
          placeholder="Or enter QR Code value manually..."
          (keyup.enter)="emitQr(qrInput.value); qrInput.value = ''"
          class="manual-input" />
        <button type="button" (click)="emitQr(qrInput.value); qrInput.value = ''" class="submit-btn">Submit</button>
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner-wrapper {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .qr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .qr-title { font-weight: 600; font-size: 0.875rem; }
    .toggle-btn {
      padding: 0.375rem 0.75rem; font-size: 0.75rem;
      background-color: var(--ecx-navy-primary); color: #fff;
      border-radius: var(--radius-sm);
    }
    .camera-viewport {
      position: relative; height: 180px;
      background-color: #000; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; margin-bottom: 0.75rem;
    }
    .viewfinder-text { color: #fff; font-size: 0.8125rem; z-index: 2; }
    .scanner-laser {
      position: absolute; top: 0; left: 0; right: 0; height: 2px;
      background-color: var(--ecx-gold-primary);
      animation: scan 2s linear infinite;
    }
    @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
    .manual-input-bar { display: flex; gap: 0.5rem; }
    .manual-input {
      flex: 1; padding: 0.5rem 0.75rem; font-size: 0.875rem;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm);
    }
    .submit-btn {
      padding: 0.5rem 1rem; background-color: var(--bg-surface-hover);
      border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.875rem;
    }
  `]
})
export class QrScannerComponent {
  @Input() title = 'Warehouse Shelf QR Code Scanner';

  qrScanned = output<string>();

  isScanning = false;

  toggleScan(): void {
    this.isScanning = !this.isScanning;
  }

  emitQr(value: string): void {
    if (value.trim()) {
      this.qrScanned.emit(value.trim());
    }
  }
}
