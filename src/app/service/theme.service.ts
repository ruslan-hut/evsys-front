import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly STORAGE_KEY = 'theme-preference';
  private readonly THEME_CLASS = 'dark-theme';
  private mediaQuery: MediaQueryList | null = null;

  private themeModeSubject = new BehaviorSubject<ThemeMode>('auto');
  themeMode$ = this.themeModeSubject.asObservable();

  private effectiveThemeSubject = new BehaviorSubject<EffectiveTheme>('light');
  effectiveTheme$ = this.effectiveThemeSubject.asObservable();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initialize();
    }
  }

  private initialize(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    const mode = saved && ['auto', 'light', 'dark'].includes(saved) ? saved : 'auto';

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => this.onSystemPreferenceChange());

    this.setTheme(mode);
  }

  setTheme(mode: ThemeMode): void {
    this.themeModeSubject.next(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);

    const effective = this.calculateEffectiveTheme(mode);
    this.effectiveThemeSubject.next(effective);
    this.applyTheme(effective);
  }

  getTheme(): ThemeMode {
    return this.themeModeSubject.value;
  }

  getEffectiveTheme(): EffectiveTheme {
    return this.effectiveThemeSubject.value;
  }

  private calculateEffectiveTheme(mode: ThemeMode): EffectiveTheme {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    return this.mediaQuery?.matches ? 'dark' : 'light';
  }

  private applyTheme(theme: EffectiveTheme): void {
    if (theme === 'dark') {
      document.documentElement.classList.add(this.THEME_CLASS);
    } else {
      document.documentElement.classList.remove(this.THEME_CLASS);
    }
    // Update mobile browser theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a2e' : '#3F51B5');
    }
  }

  private onSystemPreferenceChange(): void {
    if (this.themeModeSubject.value === 'auto') {
      const effective = this.calculateEffectiveTheme('auto');
      this.effectiveThemeSubject.next(effective);
      this.applyTheme(effective);
    }
  }
}
