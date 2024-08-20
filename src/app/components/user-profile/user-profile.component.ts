import { Component } from '@angular/core';
import {AccountService} from "../../service/account.service";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {Router} from "@angular/router";

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatCardContent
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {

  constructor(
    private router: Router
  ) {
  }

  openPaymentMethods() {
    this.router.navigate(['/payment-methods']).then(r =>
      console.log('navigated to payment methods'));
  }

}
