import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { DateAdapter } from '@angular/material/core';

export type AppLanguage = 'en' | 'es';

const STORAGE_KEY = 'lang';
const SUPPORTED: AppLanguage[] = ['en', 'es'];
const DEFAULT_LANG: AppLanguage = 'en';

const MAT_DATE_LOCALE_MAP: Record<AppLanguage, string> = {
  en: 'en-GB',
  es: 'es-ES'
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly dateAdapter = inject(DateAdapter);

  private readonly currentSubject = new BehaviorSubject<AppLanguage>(DEFAULT_LANG);
  readonly current$: Observable<AppLanguage> = this.currentSubject.asObservable();

  readonly supported = SUPPORTED;

  init(): void {
    this.translate.addLangs(SUPPORTED);
    const lang = this.resolveInitialLanguage();
    this.applyLanguage(lang);
  }

  get current(): AppLanguage {
    return this.currentSubject.value;
  }

  setLanguage(lang: AppLanguage): void {
    if (!SUPPORTED.includes(lang) || lang === this.currentSubject.value) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyLanguage(lang);
  }

  private applyLanguage(lang: AppLanguage): void {
    this.translate.use(lang).subscribe();
    this.dateAdapter.setLocale(MAT_DATE_LOCALE_MAP[lang]);
    this.currentSubject.next(lang);
  }

  private resolveInitialLanguage(): AppLanguage {
    const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
    if (stored && SUPPORTED.includes(stored)) {
      return stored;
    }
    const browser = navigator.language?.toLowerCase() ?? '';
    if (browser.startsWith('es')) {
      return 'es';
    }
    return DEFAULT_LANG;
  }
}
