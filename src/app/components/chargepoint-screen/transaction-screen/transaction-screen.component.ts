import {Component, Inject, Input, OnInit, Optional} from '@angular/core';
import {Transaction} from "../../../models/transaction";
import {CSService} from "../../../service/cs.service";
import {ErrorService} from "../../../service/error.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {TransactionService} from "../../../service/transaction.service";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";

@Component({
  selector: 'app-transaction-screen',
  templateUrl: './transaction-screen.component.html',
  styleUrl: './transaction-screen.component.css'
})
export class TransactionScreenComponent implements OnInit {

  transaction: Transaction;
  @Input() transactionId!: number;

  constructor(
    public dialog: MatDialog,
    private transactionService: TransactionService,
  ) {
  }

  ngOnInit(): void {
    this.transactionService.getTransaction(this.transactionId).subscribe((transaction) => {
      this.transaction = transaction;
    });
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }

  getDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    let formattedDuration = '';

    if (hours < 10) {
      formattedDuration += '0';
    }
    if (hours > 0) {
      formattedDuration += hours + ':';
    }else {
      formattedDuration += '0:';
    }

    if (minutes < 10) {
      formattedDuration += '0';
    }
    formattedDuration += minutes;

    return formattedDuration;
  }


}
