import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject} from '@angular/core';
import {Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
  MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow} from '@angular/material/table';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {PaymentRetryService} from '../../service/payment-retry.service';
import {ErrorService} from '../../service/error.service';
import {PaymentRetryItem} from '../../models/payment-retry';
import {BasicDialogComponent} from '../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../models/dialog-data';

@Component({
  selector: 'app-payment-retries',
  templateUrl: './payment-retries.component.html',
  styleUrls: ['./payment-retries.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatProgressBar,
    MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
    MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow,
    MatIconButton, MatIcon, MatTooltip,
    MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle,
    TranslatePipe,
  ],
})
export class PaymentRetriesComponent implements OnInit {
  private readonly retryService = inject(PaymentRetryService);
  private readonly errorService = inject(ErrorService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = ['transaction_id', 'attempt', 'next_retry_time',
    'charge_point_id', 'username', 'payment_amount', 'last_error', 'actions'];

  loading = false;
  retries: PaymentRetryItem[] = [];
  forcingId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.retryService.list().subscribe({
      next: (items) => {
        this.retries = items ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadRetryQueue'));
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  viewTransaction(transactionId: number): void {
    this.router.navigate(['/transactions', transactionId]);
  }

  formatAmount(amount: number | undefined): string {
    return ((amount ?? 0) / 100).toFixed(2);
  }

  forceRetry(row: PaymentRetryItem): void {
    const data: DialogData = {
      title: this.translate.instant('paymentRetries.forceTitle'),
      content: this.translate.instant('paymentRetries.forceContent',
        {transaction: row.transaction_id}),
      buttonYes: this.translate.instant('paymentRetries.forceYes'),
      buttonNo: this.translate.instant('paymentRetries.forceNo'),
      checkboxes: [],
    };
    const ref = this.dialog.open(BasicDialogComponent, {width: '360px', data});
    ref.afterClosed().subscribe((result) => {
      if (result !== 'yes') return;
      this.forcingId = row.transaction_id;
      this.cdr.markForCheck();
      this.retryService.forceRetry(row.transaction_id).subscribe({
        next: () => {
          this.forcingId = null;
          this.errorService.handle(this.translate.instant('paymentRetries.forceDone'));
          this.load();
        },
        error: () => {
          this.forcingId = null;
          this.errorService.handle(this.translate.instant('errors.forceRetry'));
          this.cdr.markForCheck();
        },
      });
    });
  }
}
