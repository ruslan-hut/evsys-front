import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Transaction } from '../../models/transaction';
import { MatDialog } from '@angular/material/dialog';
import { TransactionService } from '../../service/transaction.service';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { DialogData } from '../../models/dialog-data';
import { Chargepoint } from '../../models/chargepoint';
import { AccountService } from '../../service/account.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardContent, MatProgressBar, MatButton, MatCardActions, MatIcon, DecimalPipe, DatePipe]
})
export class TransactionScreenComponent implements OnInit, OnDestroy {
  readonly dialog = inject(MatDialog);
  readonly transactionService = inject(TransactionService);
  readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();
  private visibilityChangeEvent!: () => void;
  private isSubscribedToUpdates = false;

  transaction!: Transaction;
  transactionId!: number;
  canStop: boolean = false;
  chargePoint!: Chargepoint;
  stopButtonIsDisabled: boolean = false;

  constructor() {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe((params: Params) => {
      this.transactionId = parseInt(params['transaction_id']);
    });
  }

  ngOnInit(): void {
    this.loadTransaction();
    this.visibilityChangeEvent = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.visibilityChangeEvent);
  }

  handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Just refresh transaction data, don't create new subscriptions
      this.refreshTransactionData();
    }
  }

  private loadTransaction(): void {
    this.transactionService.getTransaction(this.transactionId).pipe(
      takeUntil(this.destroy$)
    ).subscribe((transaction) => {
      if (!transaction) {
        this.close();
        return;
      }

      this.transaction = transaction;
      this.canStop = transaction.can_stop;
      this.cdr.markForCheck();

      // Subscribe to updates only once
      if (!this.isSubscribedToUpdates) {
        this.isSubscribedToUpdates = true;
        this.transactionService.subscribeOnUpdates(
          transaction.transaction_id,
          transaction.charge_point_id,
          transaction.connector_id
        );
      }

      // Listen for transaction updates
      this.transactionService.getTransactions().pipe(
        takeUntil(this.destroy$)
      ).subscribe((transactions) => {
        const updated = transactions.find(t => t.transaction_id === this.transactionId);
        if (updated) {
          this.transaction = updated;
          this.canStop = updated.can_stop;
          this.cdr.markForCheck();
        }
      });
    });
  }

  private refreshTransactionData(): void {
    this.transactionService.getTransaction(this.transactionId).pipe(
      take(1)
    ).subscribe((transaction) => {
      if (transaction) {
        this.transaction = transaction;
        this.canStop = transaction.can_stop;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.transaction && this.isSubscribedToUpdates) {
      this.transactionService.unsubscribeFromUpdates(
        this.transaction.transaction_id,
        this.transaction.charge_point_id,
        this.transaction.connector_id
      );
    }
    document.removeEventListener('visibilitychange', this.visibilityChangeEvent);
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }

  getDuration(): string {
    let duration = 0;
    if (this.transaction.meter_values) {
      if (this.transaction.meter_values.length > 0) {
        duration = (new Date(this.transaction.meter_values[this.transaction.meter_values.length - 1].time).getTime() - new Date(this.transaction.time_started).getTime()) / 1000;
      }
    }

    return this.formatDuration(duration);
  }

  formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesString}`;
  }

  stop(): void {
    this.stopDialog('Are you sure?');
  }

  stopDialog(text: string): void {
    const dialogData: DialogData = {
      title: 'Stop transaction',
      content: text,
      buttonYes: 'Yes',
      buttonNo: 'No',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '300px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.stopButtonIsDisabled = true;
        this.transactionService.stopTransaction(
          this.transaction.charge_point_id,
          this.transaction.connector_id,
          this.transaction.transaction_id
        );

        this.transactionService.transactionId.pipe(
          takeUntil(this.destroy$)
        ).subscribe((transactionId) => {
          if (transactionId === -1) {
            this.close();
          }
        });
      }
    });
  }

  close(): void {
    this.router.navigate(['/points']).then(_ => {});
  }
}
