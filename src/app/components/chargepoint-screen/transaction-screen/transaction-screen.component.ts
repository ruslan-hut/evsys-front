import {Component, Input, OnInit} from '@angular/core';
import {Transaction} from "../../../models/transaction";
import {CSService} from "../../../service/cs.service";
import {ErrorService} from "../../../service/error.service";
import {MatDialog} from "@angular/material/dialog";
import {TransactionService} from "../../../service/transaction.service";
import {BasicDialogComponent} from "../../dialogs/basic/basic-dialog.component";
import {CsResponse} from "../../../models/cs-response";
import {DialogData} from "../../../models/dialog-data";
import {ChargepointService} from "../../../service/chargepoint.service";
import {Chargepoint} from "../../../models/chargepoint";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-transaction-screen',
  templateUrl: './transaction-screen.component.html',
  styleUrl: './transaction-screen.component.css'
})
export class TransactionScreenComponent implements OnInit {

  transaction: Transaction;
  @Input() transactionId!: number;
  canStop: boolean = false;
  chargePoint: Chargepoint;

  constructor(
    public dialog: MatDialog,
    private transactionService: TransactionService,
    private csService: CSService,
    private errorService: ErrorService,
    private chargePointService: ChargepointService
  ) {
  }

  ngOnInit(): void {
    this.transactionService.getTransaction(this.transactionId).subscribe((transaction) => {
      this.transaction = transaction;
      if(transaction){
        this.canStop = transaction.can_stop;
        this.transactionService.subscribeOnUpdates(transaction.transaction_id, transaction.charge_point_id, transaction.connector_id);
        this.transactionService.getTransactions().subscribe((transactions) => {
          transactions.forEach((transaction) => {
            if (transaction.transaction_id === this.transaction.transaction_id) {
              this.transaction = transaction;
              this.canStop = transaction.can_stop;
            }
          });
        });

        this.chargePointService.getChargePoint(this.transaction.charge_point_id).subscribe((chargePoint) => {
          this.chargePoint = chargePoint;
        });
      }
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

  stop(): void {
    if (this.canStop) {
      this.csService.stopTransaction(this.transaction.charge_point_id, this.transaction.connector_id, this.transaction.transaction_id.toString()).subscribe({
        next: (result) => {
          const resp = (JSON.parse(result.info) as CsResponse);
          if (resp.status == "Accepted" && result.status == 'success') {
            this.alertDialog("Transaction stopped");
          } else {
            if (resp.error != null) {
              this.errorService.handle(resp.error);
            }else{
              this.errorService.handle(resp.status);
            }
            if (environment.debug) {
              console.log(result)
            }
          }
        }
      });
    }
  }

  alertDialog(text: string): void {
    let dialogData: DialogData = {
      title: "Alert",
      content: text,
      buttonYes: "Ok",
      buttonNo: "",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {

      }
    });
  }

  getPowerRate(){
    if(this.isCharging()){
      return this.transaction.meter_values[this.transaction.meter_values.length - 1].power_rate;
    }

    return this.transaction.power_rate;
  }

}
