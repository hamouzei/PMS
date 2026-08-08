import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-kpi-tile',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="kpi-tile" [class.alert]="alert()" [class.clickable]="!!routerLink()" (click)="navigate()">
      <div class="kpi-icon">
        <app-icon [name]="icon()" [size]="24"></app-icon>
      </div>
      <div class="kpi-body">
        <span class="kpi-value" [class.loading]="loading()">{{ loading() ? '—' : value() }}</span>
        <span class="kpi-label">{{ label() }}</span>
      </div>
      <div *ngIf="subtitle()" class="kpi-subtitle">{{ subtitle() }}</div>
    </div>
  `,
  styles: [`
    .kpi-tile {
      display: flex; flex-direction: column; gap: 0.5rem; padding: 1.25rem;
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative; overflow: hidden;
      &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--ecx-navy-primary), var(--ecx-gold-primary)); }
      &.alert::before { background: linear-gradient(90deg, var(--ecx-warning), var(--ecx-danger)); }
      &.clickable { cursor: pointer; &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); } }
    }
    .kpi-icon { color: var(--icon-accent); display: inline-flex; align-items: center; }
    .alert .kpi-icon { color: var(--ecx-warning); }
    .kpi-body { display: flex; flex-direction: column; gap: 0.125rem; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: var(--text-primary); line-height: 1; letter-spacing: -0.025em; &.loading { opacity: 0.3; } }
    .kpi-label { font-size: 0.8125rem; font-weight: 500; color: var(--text-secondary); }
    .kpi-subtitle { font-size: 0.75rem; color: var(--text-muted); }
  `]
})
export class KpiTileComponent {
  icon = input<string>('package');
  value = input<number | string>(0);
  label = input<string>('');
  subtitle = input<string>('');
  alert = input<boolean>(false);
  loading = input<boolean>(false);
  routerLink = input<string>('');

  navigate(): void {
    const link = this.routerLink();
    if (link) window.location.hash = ''; // handled by parent via click
  }
}
