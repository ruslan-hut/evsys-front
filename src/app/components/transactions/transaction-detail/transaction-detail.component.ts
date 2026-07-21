import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {DecimalPipe, DatePipe, Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';

import {MatCard, MatCardHeader, MatCardTitle, MatCardContent} from '@angular/material/card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatDivider} from '@angular/material/divider';
import {MatDialog} from '@angular/material/dialog';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow} from '@angular/material/table';
import {NgxChartsModule, Color, ScaleType} from '@swimlane/ngx-charts';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {TransactionService} from '../../../service/transaction.service';
import {ErrorService} from '../../../service/error.service';
import {AccountService} from '../../../service/account.service';
import {PrintService} from '../../../service/print.service';
import {PaymentRetryService} from '../../../service/payment-retry.service';
import {TransactionListItem, TransactionMeterValue, PaymentOrder, calculateConsumed} from '../../../models/transaction-list-item';
import {PaymentRetryItem} from '../../../models/payment-retry';
import {BasicDialogComponent} from '../../dialogs/basic/basic-dialog.component';
import {
  EmailTransactionDialogComponent,
  EmailTransactionDialogData
} from '../../dialogs/email-transaction/email-transaction-dialog.component';
import {DialogData} from '../../../models/dialog-data';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    DatePipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatTooltip,
    MatIcon,
    MatProgressBar,
    MatDivider,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    NgxChartsModule,
    TranslatePipe
  ]
})
export class TransactionDetailComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly retryService = inject(PaymentRetryService);
  private readonly accountService = inject(AccountService);
  private readonly printService = inject(PrintService);
  private readonly errorService = inject(ErrorService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialog = inject(MatDialog);

  transaction: TransactionListItem | null = null;
  activeRetry: PaymentRetryItem | null = null;
  loading = false;
  forcingRetry = false;
  sendingEmail = false;
  savingPdf = false;

  paymentOrderColumns: string[] = ['order', 'amount', 'result', 'time_opened', 'time_closed'];

  chartData: ChartSeries[] = [];
  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5', '#4caf50']
  };

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadTransaction(parseInt(idParam, 10));
    }
  }

  loadTransaction(transactionId: number): void {
    this.loading = true;
    this.transactionService.getTransactionDetails(transactionId).subscribe({
      next: (transaction) => {
        this.transaction = transaction;
        this.prepareChartData();
        this.loading = false;
        this.cdr.markForCheck();
        this.loadActiveRetry(transactionId);
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadTransaction'));
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadActiveRetry(transactionId: number): void {
    this.retryService.list().subscribe({
      next: (items) => {
        this.activeRetry = (items ?? []).find(i => i.transaction_id === transactionId) ?? null;
        this.cdr.markForCheck();
      },
      error: () => { /* non-fatal: retry block simply absent */ }
    });
  }

  viewRetryQueue(): void {
    this.router.navigate(['/payment-retries']);
  }

  forceRetry(): void {
    const tx = this.transaction;
    if (!tx?.transaction_id) return;
    const data: DialogData = {
      title: this.translate.instant('paymentRetries.forceTitle'),
      content: this.translate.instant('paymentRetries.forceContent',
        {transaction: tx.transaction_id}),
      buttonYes: this.translate.instant('paymentRetries.forceYes'),
      buttonNo: this.translate.instant('paymentRetries.forceNo'),
      checkboxes: [],
    };
    const ref = this.dialog.open(BasicDialogComponent, {width: '360px', data});
    ref.afterClosed().subscribe((result) => {
      if (result !== 'yes') return;
      const transactionId = tx.transaction_id!;
      this.forcingRetry = true;
      this.cdr.markForCheck();
      this.retryService.forceRetry(transactionId).subscribe({
        next: () => {
          this.forcingRetry = false;
          this.errorService.handle(this.translate.instant('paymentRetries.forceDone'));
          this.loadTransaction(transactionId);
        },
        error: () => {
          this.forcingRetry = false;
          this.errorService.handle(this.translate.instant('errors.forceRetry'));
          this.cdr.markForCheck();
        },
      });
    });
  }

  sendEmail(): void {
    const tx = this.transaction;
    if (!tx?.transaction_id) return;

    const data: EmailTransactionDialogData = {
      transactionId: tx.transaction_id,
      defaultEmail: this.accountService.userValue?.email ?? ''
    };
    const ref = this.dialog.open(EmailTransactionDialogComponent, {width: '400px', data});

    ref.afterClosed().subscribe((email?: string) => {
      if (!email) return;
      this.sendingEmail = true;
      this.cdr.markForCheck();
      this.transactionService.sendTransactionEmail(tx.transaction_id, email).subscribe({
        next: () => {
          this.sendingEmail = false;
          this.errorService.handle(this.translate.instant('transactionDetail.email.sent', {email}));
          this.cdr.markForCheck();
        },
        error: () => {
          this.sendingEmail = false;
          this.errorService.handle(this.translate.instant('errors.sendTransactionEmail'));
          this.cdr.markForCheck();
        }
      });
    });
  }

  savePdf(): void {
    const tx = this.transaction;
    if (!tx?.transaction_id) return;

    this.savingPdf = true;
    this.cdr.markForCheck();

    const done = (): void => {
      this.savingPdf = false;
      this.cdr.markForCheck();
    };
    const fail = (): void => {
      done();
      this.errorService.handle(this.translate.instant('errors.savePdf'));
    };

    this.transactionService.getTransactionReceipt(tx.transaction_id).subscribe({
      next: (html) => {
        this.printService
          .printDocument(html, `transaction-${tx.transaction_id}`)
          .then(done)
          .catch(fail);
      },
      error: fail
    });
  }

  prepareChartData(): void {
    if (!this.transaction?.meter_values?.length) {
      this.chartData = [];
      return;
    }

    const energySeries: ChartDataPoint[] = this.transaction.meter_values.map((mv, index) => ({
      name: this.formatChartTime(mv.time || mv.timestamp, index),
      value: (mv.consumed_energy || mv.value) / 1000
    }));

    // power_rate_wh is power_rate in kW; fall back for samples stored before
    // the backend sent it.
    const powerSeries: ChartDataPoint[] = this.transaction.meter_values.map((mv, index) => ({
      name: this.formatChartTime(mv.time || mv.timestamp, index),
      value: mv.power_rate_wh ?? mv.power_rate / 1000
    }));

    this.chartData = [
      {name: this.translate.instant('transactionDetail.energySeries'), series: energySeries},
      {name: this.translate.instant('transactionDetail.powerSeries'), series: powerSeries}
    ];
  }

  formatChartTime(timestamp: string | undefined, index: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // Use index to create unique names for all points
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}#${index}`;
  }

  xAxisTickFormatting = (value: string): string => {
    // Extract time part before the index marker
    const timePart = value.split('#')[0];
    if (!timePart) return '';

    const [hours, minutes] = timePart.split(':').map(Number);
    // Only show label if minutes are at 15-min intervals (0, 15, 30, 45)
    if (minutes % 15 === 0) {
      return timePart;
    }
    return '';
  };

  getConsumed(): number {
    if (!this.transaction) return 0;
    return calculateConsumed(this.transaction);
  }

  formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }

  goBack(): void {
    this.location.back();
  }

  getDuration(): string {
    if (!this.transaction) return '-';

    // If duration is provided directly by API, use it (in seconds)
    if (this.transaction.duration !== undefined) {
      const totalMinutes = Math.floor(this.transaction.duration / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Otherwise calculate from timestamps
    const startTime = this.transaction.time_start || this.transaction.time_started;
    if (!startTime) return '-';

    const start = new Date(startTime);
    const end = this.transaction.time_stop
      ? new Date(this.transaction.time_stop)
      : new Date();

    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getMeterValues(): TransactionMeterValue[] {
    return this.transaction?.meter_values || [];
  }

  getPaymentOrders(): PaymentOrder[] {
    return this.transaction?.payment_orders || [];
  }

  getAveragePower(): number | null {
    const meterValues = this.transaction?.meter_values;
    if (!meterValues?.length) return null;

    const powerValues = meterValues
      .map(mv => mv.power_rate)
      .filter(p => p !== undefined && p > 0);

    if (!powerValues.length) return null;

    const sum = powerValues.reduce((acc, val) => acc + val, 0);
    return sum / powerValues.length;
  }
}
