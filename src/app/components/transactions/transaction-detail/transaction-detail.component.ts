import {Component, OnInit} from '@angular/core';
import {DecimalPipe, DatePipe, Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';

import {MatCard, MatCardHeader, MatCardTitle, MatCardContent} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatDivider} from '@angular/material/divider';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow} from '@angular/material/table';

import {TransactionService} from '../../../service/transaction.service';
import {ErrorService} from '../../../service/error.service';
import {TransactionListItem, TransactionMeterValue, calculateConsumed} from '../../../models/transaction-list-item';

@Component({
  selector: 'app-transaction-detail',
  templateUrl: './transaction-detail.component.html',
  styleUrls: ['./transaction-detail.component.css'],
  standalone: true,
  imports: [
    DecimalPipe,
    DatePipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIcon,
    MatProgressBar,
    MatDivider,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow
  ]
})
export class TransactionDetailComponent implements OnInit {
  transaction: TransactionListItem | null = null;
  loading = false;

  meterValueColumns: string[] = ['timestamp', 'value', 'power_rate', 'price'];

  constructor(
    private transactionService: TransactionService,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

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
        this.loading = false;
      },
      error: () => {
        this.errorService.handle('Failed to load transaction details');
        this.loading = false;
      }
    });
  }

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
    if (!this.transaction || !this.transaction.time_start) return '-';

    const start = new Date(this.transaction.time_start);
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
}
