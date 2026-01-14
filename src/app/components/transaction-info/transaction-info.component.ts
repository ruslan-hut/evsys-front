import { Component, Inject, OnInit, OnDestroy, Optional, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransactionService } from '../../service/transaction.service';
import { Transaction } from '../../models/transaction';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { DialogData } from '../../models/dialog-data';
import { CSService } from '../../service/cs.service';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'transaction-info',
  templateUrl: './transaction-info.component.html',
  styleUrls: ['./transaction-info.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatProgressBar, MatCardActions, MatButton, DecimalPipe, DatePipe]
})
export class TransactionInfoComponent implements OnInit, OnDestroy {
  private readonly csService = inject(CSService);
  readonly dialog = inject(MatDialog);
  private readonly transactionService = inject(TransactionService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly dialogRef = inject(MatDialogRef<BasicDialogComponent>, { optional: true });
  readonly data = inject<number>(MAT_DIALOG_DATA, { optional: true });

  private destroy$ = new Subject<void>();

  transaction!: Transaction;
  transactionId = -1;

  constructor() {
    if (this.data) {
      this.transactionId = this.data;
    }
  }

  ngOnInit(): void {
    if (this.transactionId >= 0) {
      this.transactionService.getTransaction(this.transactionId).pipe(
        takeUntil(this.destroy$)
      ).subscribe((transaction) => {
        this.transaction = transaction;
        this.cdr.markForCheck();

        this.transactionService.subscribeOnUpdates(
          this.transactionId,
          this.transaction.charge_point_id,
          this.transaction.connector_id
        );

        // Listen for updates
        this.transactionService.getTransactions().pipe(
          takeUntil(this.destroy$)
        ).subscribe((transactions) => {
          const updated = transactions.find(t => t.transaction_id === this.transactionId);
          if (updated) {
            this.transaction = updated;
            this.cdr.markForCheck();
          }
        });
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.transaction) {
      this.transactionService.unsubscribeFromUpdates(
        this.transaction.transaction_id,
        this.transaction.charge_point_id,
        this.transaction.connector_id
      );
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
    } else {
      formattedDuration += '0:';
    }

    if (minutes < 10) {
      formattedDuration += '0';
    }
    formattedDuration += minutes;

    return formattedDuration;
  }

  stopTransaction(): void {
    const dialogData: DialogData = {
      title: 'Stop',
      content: '',
      buttonYes: 'Stop',
      buttonNo: 'Close',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.csService.stopTransaction(
          this.transaction.charge_point_id,
          this.transaction.connector_id,
          this.transaction.transaction_id.toString()
        ).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (result) => {
            this.csService.processCentralSystemResponse(result, 'Transaction stopped');
          }
        });
      }
    });
  }

  isCharging(): boolean {
    return this.transaction.status.toLowerCase() === 'charging';
  }
}
