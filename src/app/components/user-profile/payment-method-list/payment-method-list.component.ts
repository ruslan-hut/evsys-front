import {Component, OnInit} from '@angular/core';
import {PaymentMethodComponent} from "../payment-method/payment-method.component";
import {MatTableDataSource} from "@angular/material/table";
import {Chargepoint} from "../../../models/chargepoint";
import {PaymentMethod} from "../../../models/payment-method";
import {AccountService} from "../../../service/account.service";
import {NgForOf} from "@angular/common";
import {ErrorService} from "../../../service/error.service";
import {Router} from "@angular/router";
import {MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-payment-method-list',
  standalone: true,
  imports: [
    PaymentMethodComponent,
    NgForOf,
    MatButton,
    MatIcon
  ],
  templateUrl: './payment-method-list.component.html',
  styleUrl: './payment-method-list.component.css'
})
export class PaymentMethodListComponent implements OnInit {

  dataSource = new MatTableDataSource<PaymentMethod>();

  constructor(
    private accountService: AccountService,
    private errorService: ErrorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.accountService.user.subscribe(user => {
      this.accountService.getUserInfo(user.username).subscribe(info=>{
        if (info.payment_methods) {
          this.dataSource.data = info.payment_methods;
          scroll(0, 0);
        };
      });
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

}
