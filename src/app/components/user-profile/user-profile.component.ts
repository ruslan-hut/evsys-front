import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { AccountService } from '../../service/account.service';
import { ThemeService, ThemeMode } from '../../service/theme.service';

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
    MatOption
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

  constructor(
    private router: Router,
    private location: Location,
    private accountService: AccountService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.getTheme();
  }

  onThemeChange(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.currentTheme = mode;
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
