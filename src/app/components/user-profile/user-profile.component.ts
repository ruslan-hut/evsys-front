import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { AccountService } from '../../service/account.service';
import { ThemeService, ThemeMode } from '../../service/theme.service';
import { LocalStorageService } from '../../service/local-storage.service';
import { TranslatePipe } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import { AppLanguage, LanguageService } from '../../service/language.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatCardContent,
    MatButton,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatSlideToggle,
    TranslatePipe,
    AsyncPipe
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly accountService = inject(AccountService);
  private readonly themeService = inject(ThemeService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly languageService = inject(LanguageService);

  readonly currentLanguage$ = this.languageService.current$;
  readonly supportedLanguages = this.languageService.supported;

  themeOptions = [
    { value: 'auto', label: 'userProfile.themes.auto', icon: 'brightness_auto' },
    { value: 'light', label: 'userProfile.themes.light', icon: 'light_mode' },
    { value: 'dark', label: 'userProfile.themes.dark', icon: 'dark_mode' }
  ];

  startPageOptions = [
    { value: '/points', label: 'userProfile.startPages.points', icon: 'ev_station', roles: ['user', 'operator', 'admin'] },
    { value: '/dashboard', label: 'userProfile.startPages.dashboard', icon: 'dashboard', roles: ['operator', 'admin'] },
    { value: '/reports', label: 'userProfile.startPages.reports', icon: 'assessment', roles: ['operator', 'admin'] },
    { value: '/log/system', label: 'userProfile.startPages.syslog', icon: 'terminal', roles: ['operator', 'admin'] }
  ];

  currentTheme: ThemeMode = this.themeService.getTheme();
  alwaysLoadAllChargers: boolean = this.localStorageService.getAlwaysLoadAllChargers();
  currentStartPage: string = this.localStorageService.getStartPage() || this.getDefaultStartPage();

  get availableStartPageOptions() {
    const userRole = this.accountService.userValue?.role || 'user';
    return this.startPageOptions.filter(option => option.roles.includes(userRole));
  }

  private getDefaultStartPage(): string {
    return (this.accountService.isAdmin || this.accountService.isOperator) ? '/dashboard' : '/points';
  }

  onThemeChange(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.currentTheme = mode;
  }

  onAlwaysLoadAllChargersChange(value: boolean): void {
    this.alwaysLoadAllChargers = value;
    this.localStorageService.setAlwaysLoadAllChargers(value);
  }

  onStartPageChange(value: string): void {
    this.currentStartPage = value;
    this.localStorageService.setStartPage(value);
  }

  onLanguageChange(lang: AppLanguage): void {
    this.languageService.setLanguage(lang);
  }

  openPaymentMethods(): void {
    this.router.navigate(['/payment-methods']).then(() => {});
  }

  back(): void {
    this.location.back();
  }

  logout(): void {
    this.accountService.logout();
  }
}
