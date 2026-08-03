import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthStore } from '../../core/auth/auth.store';
import { EthiopianCalendarService } from '../../core/services/ethiopian-calendar.service';
import { EthiopianDatePipe } from '../../shared/pipes/ethiopian-date.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, EthiopianDatePipe],
  template: `
    <div class="dashboard-header">
      <h2>Welcome back, {{ authStore.user()?.fullName || 'User' }}</h2>
      <p class="subtitle">Today is {{ today | ethiopianDate }} (Gregorian: {{ today | date: 'mediumDate' }})</p>
    </div>

    <div class="welcome-card">
      <h3>Phase 1 Core Architecture Ready</h3>
      <p>The foundation of the ECX Property Automation System frontend is established with Standalone Architecture, Signals, SCSS design tokens, and functional interceptors.</p>
    </div>
  `,
  styles: [`
    .dashboard-header { margin-bottom: 1.5rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
    .welcome-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      h3 { color: var(--ecx-navy-primary); font-size: 1.125rem; margin-bottom: 0.5rem; }
      p { color: var(--text-secondary); font-size: 0.875rem; margin: 0; }
    }
  `]
})
export class DashboardComponent {
  public readonly authStore = inject(AuthStore);
  public readonly ethCalendar = inject(EthiopianCalendarService);

  public readonly today = new Date();
}
