import { Component } from '@angular/core';
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

@Component({
  selector: 'app-user-profile',
  standalone: true,
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
    MatSlideToggle
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  themeOptions = [
    { value: 'auto', label: 'Auto (System)', icon: 'brightness_auto' },
    { value: 'light', label: 'Light', icon: 'light_mode' },
    { value: 'dark', label: 'Dark', icon: 'dark_mode' }
  ];

  currentTheme: ThemeMode;
  alwaysLoadAllChargers: boolean;

  constructor(
    private router: Router,
    private location: Location,
    private accountService: AccountService,
    private themeService: ThemeService,
    private localStorageService: LocalStorageService
  ) {
    this.currentTheme = this.themeService.getTheme();
    this.alwaysLoadAllChargers = this.localStorageService.getAlwaysLoadAllChargers();
  }

  onThemeChange(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.currentTheme = mode;
  }

  onAlwaysLoadAllChargersChange(value: boolean): void {
    this.alwaysLoadAllChargers = value;
    this.localStorageService.setAlwaysLoadAllChargers(value);
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
