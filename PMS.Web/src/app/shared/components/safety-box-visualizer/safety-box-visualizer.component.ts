import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafetyBoxShelf } from '../../../core/models/master-data.model';

@Component({
  selector: 'app-safety-box-visualizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="safety-box-card">
      <div class="box-header">
        <span class="box-title">Safety Box #{{ boxNumber }}</span>
        <span class="box-category" *ngIf="category">{{ category }}</span>
      </div>

      <div class="shelf-grid">
        <div *ngFor="let shelf of shelves" class="shelf-card">
          <div class="shelf-header">
            <span class="shelf-label">{{ shelf.shelfLabel }}</span>
            <span class="shelf-location" *ngIf="shelf.shelfLocation">
              {{ shelf.shelfLocation.shelfNumber }}
            </span>
          </div>

          <div class="capacity-bar-wrapper">
            <div class="capacity-label">
              <span>Weight Capacity</span>
              <span>{{ shelf.weightCapacity || 'Uncapped' }} kg</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill weight-fill" style="width: 45%;"></div>
            </div>
          </div>

          <div class="capacity-bar-wrapper">
            <div class="capacity-label">
              <span>Volume Capacity</span>
              <span>{{ shelf.volumeCapacity || 'Uncapped' }} m³</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill volume-fill" style="width: 60%;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .safety-box-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .box-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .box-title { font-size: 1.125rem; font-weight: 600; color: var(--ecx-navy-primary); }
    .box-category {
      font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.625rem;
      background-color: var(--ecx-gold-light); color: #92400E; border-radius: 9999px;
    }
    .shelf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .shelf-card {
      background-color: var(--bg-app); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); padding: 0.875rem;
    }
    .shelf-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
    .shelf-label { font-weight: 600; font-size: 0.875rem; }
    .shelf-location { font-size: 0.75rem; color: var(--text-muted); }
    .capacity-bar-wrapper { margin-bottom: 0.5rem; }
    .capacity-label { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .progress-bar {
      height: 6px; background-color: var(--border-color); border-radius: 9999px; overflow: hidden;
    }
    .progress-fill { height: 100%; border-radius: 9999px; }
    .weight-fill { background-color: var(--ecx-info); }
    .volume-fill { background-color: var(--ecx-gold-primary); }
  `]
})
export class SafetyBoxVisualizerComponent {
  @Input({ required: true }) boxNumber = '';
  @Input() category = '';
  @Input() shelves: SafetyBoxShelf[] = [];
}
