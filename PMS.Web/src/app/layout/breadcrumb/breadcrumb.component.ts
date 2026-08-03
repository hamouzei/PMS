import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li class="breadcrumb-item">
          <a routerLink="/dashboard">Home</a>
        </li>
        <li *ngFor="let crumb of breadcrumbs; let last = last" class="breadcrumb-item" [class.active]="last">
          <span class="separator">/</span>
          <a *ngIf="!last" [routerLink]="crumb.url">{{ crumb.label }}</a>
          <span *ngIf="last">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-nav { margin-bottom: 1.25rem; }
    .breadcrumb-list {
      display: flex; align-items: center; gap: 0.5rem;
      list-style: none; padding: 0; margin: 0;
      font-size: 0.8125rem; color: var(--text-secondary);
    }
    .breadcrumb-item {
      display: flex; align-items: center; gap: 0.5rem;
      &.active span { color: var(--text-primary); font-weight: 600; }
    }
    .separator { color: var(--text-muted); }
  `]
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  public breadcrumbs: Breadcrumb[] = [];

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.breadcrumbs = this.buildBreadcrumbs(this.router.url);
    });
  }

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [];
    let currentUrl = '';

    for (const part of parts) {
      if (part === 'dashboard') continue;
      currentUrl += `/${part}`;
      const label = part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label, url: currentUrl });
    }

    return crumbs;
  }
}
