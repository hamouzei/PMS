import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <span>&copy; {{ currentYear }} Ethiopian Commodity Exchange (ECX). All rights reserved.</span>
      <span>Property Automation System (PAS) v1.0</span>
    </footer>
  `,
  styles: [`
    .app-footer {
      height: 40px;
      padding: 0 1.5rem;
      border-top: 1px solid var(--border-color);
      background-color: var(--bg-surface);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 0.75rem; color: var(--text-muted);
    }
  `]
})
export class FooterComponent {
  public readonly currentYear = new Date().getFullYear();
}
