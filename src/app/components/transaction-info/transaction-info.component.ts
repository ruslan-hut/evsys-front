import {Component, Inject, OnInit, Optional} from "@angular/core";
import {TransactionService} from "../../service/transaction.service";
import {Transaction} from "../../models/transaction";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../models/dialog-data";
import {CSService} from "../../service/cs.service";
import { DecimalPipe, DatePipe } from "@angular/common";
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatProgressBar } from "@angular/material/progress-bar";
import { MatButton } from "@angular/material/button";

@Component({
    selector: 'transaction-info',
    templateUrl: './transaction-info.component.html',
    styleUrls: ['./transaction-info.component.css'],
    standalone: true,
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar, MatCardActions, MatButton, DecimalPipe, DatePipe]
})
export class TransactionInfoComponent implements OnInit{

  transaction: Transaction;
  transactionId = -1;

  constructor(
    private csService: CSService,
    public dialog: MatDialog,
    private transactionService: TransactionService,
    @Optional() public dialogRef?: MatDialogRef<BasicDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: number,
  ) {
    if (data) {
      this.transactionId = data;
    }
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

  stopTransaction() {
    let dialogData: DialogData = {
      title: "Stop",
      content: "",
      buttonYes: "Stop",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.csService.stopTransaction(this.transaction.charge_point_id, this.transaction.connector_id, this.transaction.transaction_id.toString()).subscribe({
          next: (result) => {
            this.csService.processCentralSystemResponse(result, "Transaction stopped")
          }
        });
      }
    });
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }

  ngOnInit(): void {
    if (this.transactionId >= 0) {
      this.transactionService.getTransaction(this.transactionId).subscribe((transaction) => {

        this.transaction= transaction;

        this.transactionService.subscribeOnUpdates(this.transactionId, this.transaction.charge_point_id, this.transaction.connector_id);

        // this.transactionService.getTransactions().subscribe((transactions) => {
        //   transactions.forEach((transaction) => {
        //     if (transaction.transaction_id === this.transaction.transaction_id) {
        //       this.transaction = transaction;
        //     }
        //   });
        // });
      });
    }
  }

}
