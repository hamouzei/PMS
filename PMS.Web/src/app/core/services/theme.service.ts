import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type ThemeMode = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeSignal = signal<ThemeMode>('light');
  public readonly currentTheme = this.themeSignal.asReadonly();

  constructor() {
    const savedTheme = (localStorage.getItem(environment.themeKey) as ThemeMode) || 'light';
    this.setTheme(savedTheme);
  }

  public toggleTheme(): void {
    const next = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  public setTheme(theme: ThemeMode): void {
    this.themeSignal.set(theme);
    localStorage.setItem(environment.themeKey, theme);
    document.documentElement.setAttribute('data-theme', theme);
  }
}
