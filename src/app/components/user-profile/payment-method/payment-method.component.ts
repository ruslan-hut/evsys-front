import {Component, Input, OnInit} from '@angular/core';
import {PaymentMethod} from "../../../models/payment-method";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import { NgClass } from "@angular/common";
import {FormsModule} from "@angular/forms";
import {AccountService} from "../../../service/account.service";
import {ErrorService} from "../../../service/error.service";
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {DialogData} from "../../../models/dialog-data";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-payment-method',
  standalone: true,
  imports: [
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatIcon,
    MatIconButton,
    MatButton,
    FormsModule,
    MatFormField,
    MatInput,
    NgClass
],
  templateUrl: './payment-method.component.html',
  styleUrl: './payment-method.component.css'
})
export class PaymentMethodComponent implements OnInit {
  @Input() paymentMethod: PaymentMethod
  isEditing: boolean = false;
  description: string = '';

  constructor(
    private accountService: AccountService,
    private errorService: ErrorService,
    public dialog: MatDialog,
  ) {
  }

  ngOnInit(): void {
    this.description = this.paymentMethod.description
  }

  cardLogo(brand: string): string {
    switch (brand) {
      case '1':
        return "Visa";
      case '2':
        return "Mastercard";
      case '8':
        return "American Express";
      default:
        return "";
    }
  }

  expiryDate(expiry_date: string): string {
    return expiry_date.slice(2, 4) + '/' + expiry_date.slice(0, 2)
  }

  setDefault() {
    this.paymentMethod.is_default = true;
    this.accountService.updatePaymentMethod(this.paymentMethod).subscribe(
      (result) => {
        if (result) {
          this.paymentMethod.is_default = result.is_default
        } else {
          if (environment.debug) {
            console.log(result)
          }
          this.errorService.handle("Failed to set default payment method")
        }
      });
  }

  editDescription() {
    this.isEditing = true;
  }

  delete() {

    let dialogData: DialogData = {
      title: "Delete",
      content: "",
      buttonYes: "Delete",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.accountService.deletePaymentMethod(this.paymentMethod).subscribe(
          (result) => {
            if (result) {
              this.paymentMethod = result
            } else {
              console.log(result)
              this.errorService.handle("Failed to delete payment method")
            }
          });
      }
    });
  }

  saveDescription() {
    this.accountService.updatePaymentMethod(this.paymentMethod).subscribe(
      (result) => {
        if (result) {
          this.paymentMethod.description = result.description
        }else {
          if (environment.debug) {
            console.log(result)
          }
          this.errorService.handle("Failed to update payment method")
        }
      }
    )
    this.isEditing = false;
    this.description = this.paymentMethod.description
  }

  cancelEdit() {
    this.isEditing = false;
    this.paymentMethod.description = this.description
  }
}
