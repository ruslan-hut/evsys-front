import {Component, Input, OnDestroy, OnInit} from '@angular/core';
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
import {AccountService} from "../../../service/account.service";
import {ActivatedRoute, Params, Router} from "@angular/router";

@Component({
  selector: 'app-transaction-screen',
  templateUrl: './transaction-screen.component.html',
  styleUrl: './transaction-screen.component.css'
})
export class TransactionScreenComponent implements OnInit, OnDestroy {

  transaction: Transaction;
  transactionId!: number;
  canStop: boolean = false;
  chargePoint: Chargepoint;

  constructor(
    public dialog: MatDialog,
    public transactionService: TransactionService,
    private chargePointService: ChargepointService,
    public accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AccountService,
  ) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.transactionId = parseInt(params['transaction_id']);
      this.authService.user.subscribe((user) => {
        if(!user){
          this.router.navigate(['account/login']);
        }

        this.authService.authState$.subscribe((auth) => {
          if (auth) {
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
        });
      });
    });

  }

  ngOnDestroy() {
    this.transactionService.unsubscribeFromUpdates(this.transaction.transaction_id, this.transaction.charge_point_id, this.transaction.connector_id);
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }

  getDuration(): string {
    let duration = 0;
    if (this.transaction.meter_values.length > 0) {
      duration = (new Date(this.transaction.meter_values[this.transaction.meter_values.length - 1].time).getTime() - new Date(this.transaction.time_started).getTime()) / 1000;
    }

    return this.formatDuration(duration);
  }

  formatDuration(duration: number): string {
    let hours = Math.floor(duration / 3600);
    let minutes = Math.floor((duration % 3600) / 60);
    return `${hours}:${minutes}`;
  }

  stop(): void {
    if (this.canStop) {
      this.transactionService.stopTransaction(this.transaction.charge_point_id, this.transaction.connector_id, this.transaction.transaction_id);
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

  close(): void {
    this.router.navigate(['/points']);
  }

}
