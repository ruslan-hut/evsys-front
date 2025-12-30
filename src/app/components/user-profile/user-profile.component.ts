import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { AccountService } from '../../service/account.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatCardContent,
    MatButton
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  constructor(
    private router: Router,
    private location: Location,
    private accountService: AccountService
  ) {}

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
