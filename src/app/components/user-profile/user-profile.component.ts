import { Component } from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {Router} from "@angular/router";
import {MatButton} from "@angular/material/button";

import { Location } from '@angular/common';

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
    private location: Location
  ) {
  }

  openPaymentMethods() {
    this.router.navigate(['/payment-methods']).then(() => {})
  }

  back(){
    this.location.back();
  }

}
