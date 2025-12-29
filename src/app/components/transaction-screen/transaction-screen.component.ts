import {  Component, OnDestroy, OnInit} from '@angular/core';
import {Transaction} from "../../models/transaction";
import {MatDialog} from "@angular/material/dialog";
import {TransactionService} from "../../service/transaction.service";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../models/dialog-data";
import {Chargepoint} from "../../models/chargepoint";
import {AccountService} from "../../service/account.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-transaction-screen',
    templateUrl: './transaction-screen.component.html',
    styleUrl: './transaction-screen.component.css',
    standalone: true,
    imports: [MatCard, MatCardContent, MatProgressBar, MatButton, MatCardActions, MatIcon, DecimalPipe, DatePipe]
})
export class TransactionScreenComponent implements OnInit, OnDestroy{

  private visibilityChangeEvent: any;

  transaction: Transaction;
  transactionId!: number;
  canStop: boolean = false;
  chargePoint: Chargepoint;
  stopButtonIsDisabled: boolean = false;

  constructor(
    public dialog: MatDialog,
    public transactionService: TransactionService,
    public accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.route.queryParams.subscribe((params: Params) => {
      this.transactionId = parseInt(params['transaction_id']);
    });
  }

  ngOnInit(): void {
    this.refreshData();
    this.visibilityChangeEvent = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.visibilityChangeEvent)
  }

  handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      this.refreshData();
    }
  }

  private refreshData(): void {
    this.accountService.user$.subscribe((user) => {
      if(user){
        this.transactionService.getTransaction(this.transactionId).subscribe((transaction) => {

          this.transaction = transaction;

          if(transaction) {
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
          } else {
            this.close()
          }
        });
      }
    })

  }

  ngOnDestroy() {
    if (this.transaction) {
      this.transactionService.unsubscribeFromUpdates(this.transaction.transaction_id, this.transaction.charge_point_id, this.transaction.connector_id);
    }
    document.removeEventListener('visibilitychange', this.visibilityChangeEvent)
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }

  getDuration(): string {
    let duration = 0;
    if(this.transaction.meter_values){
      if (this.transaction.meter_values.length > 0) {
        duration = (new Date(this.transaction.meter_values[this.transaction.meter_values.length - 1].time).getTime() - new Date(this.transaction.time_started).getTime()) / 1000;
      }
    }

    return this.formatDuration(duration);
  }

  formatDuration(duration: number): string {
    let hours = Math.floor(duration / 3600);
    let minutes = Math.floor((duration % 3600) / 60);
    let minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesString}`;
  }

  stop(): void {
    this.stopDialog("Are you sure?");
  }

  stopDialog(text: string): void {
    let dialogData: DialogData = {
      title: "Stop transaction",
      content: text,
      buttonYes: "Yes",
      buttonNo: "No",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '300px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.stopButtonIsDisabled = true;
        this.transactionService.stopTransaction(this.transaction.charge_point_id, this.transaction.connector_id, this.transaction.transaction_id);
        // setTimeout(() => {
        //   this.isStopped = false;
        // }, 10000);
        this.transactionService.transactionId.subscribe((transactionId) => {
          if(transactionId == -1){
            this.close();
          }
        });
      }
    });
  }

  // getPowerRate(){
  //   if(this.isCharging()){
  //     return this.transaction.meter_values[this.transaction.meter_values.length - 1].power_rate;
  //   }
  //
  //   return this.transaction.power_rate;
  // }

  close(): void {
    this.router.navigate(['/points']).then(_ => {});
  }

  // newTransaction(): void {
  //   this.router.navigate(['new-transactions'], {
  //     queryParams: { charge_point_id: this.transaction.charge_point_id, connector_id: this.transaction.connector_id }
  //   });
  // }

}
