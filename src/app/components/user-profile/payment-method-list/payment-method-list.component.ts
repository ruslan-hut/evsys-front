import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {PaymentMethodComponent} from "../payment-method/payment-method.component";
import {MatTableDataSource} from "@angular/material/table";
import {PaymentMethod} from "../../../models/payment-method";
import {AccountService} from "../../../service/account.service";

import {Router} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import { Location } from '@angular/common';

@Component({
  selector: 'app-payment-method-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaymentMethodComponent,
    MatButton,
    MatIcon
],
  templateUrl: './payment-method-list.component.html',
  styleUrl: './payment-method-list.component.css'
})
export class PaymentMethodListComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);

  dataSource = new MatTableDataSource<PaymentMethod>();

  ngOnInit(): void {
    this.accountService.user$.subscribe(user => {
      if (user) {
        this.accountService.getUserInfo(user.username).subscribe(info => {
          if (info.payment_methods) {
            this.dataSource.data = info.payment_methods;
            scroll(0, 0);
          }
          this.cdr.markForCheck();
        });
      }else{
        this.dataSource.data = []
      }
      this.cdr.markForCheck();
    });
  }

  selectPaymentMethod(paymentMethod: PaymentMethod) {
    this.dataSource.data.forEach(p =>
      p.selected = p.identifier === paymentMethod.identifier ? !p.selected : false
    );
  }

  addPaymentMethod() {
    this.router.navigate(['/bank']).then(() => {});
  }

  back(){
    this.location.back();
  }

}
