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
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {PaymentRetryService} from '../../service/payment-retry.service';
import {ErrorService} from '../../service/error.service';
import {PaymentRetryItem} from '../../models/payment-retry';

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

  readonly displayedColumns = ['transaction_id', 'attempt', 'next_retry_time',
    'charge_point_id', 'username', 'payment_amount', 'last_error', 'actions'];

  loading = false;
  retries: PaymentRetryItem[] = [];

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
}
