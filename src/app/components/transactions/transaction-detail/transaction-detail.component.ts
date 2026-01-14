import {Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {DecimalPipe, DatePipe, TitleCasePipe, Location} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';

import {MatCard, MatCardHeader, MatCardTitle, MatCardContent} from '@angular/material/card';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatDivider} from '@angular/material/divider';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow} from '@angular/material/table';
import {NgxChartsModule, Color, ScaleType} from '@swimlane/ngx-charts';

import {TransactionService} from '../../../service/transaction.service';
import {ErrorService} from '../../../service/error.service';
import {TransactionListItem, TransactionMeterValue, PaymentOrder, calculateConsumed} from '../../../models/transaction-list-item';

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
    TitleCasePipe,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
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
    NgxChartsModule
  ]
})
export class TransactionDetailComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly cdr = inject(ChangeDetectorRef);

  transaction: TransactionListItem | null = null;
  loading = false;

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
      },
      error: () => {
        this.errorService.handle('Failed to load transaction details');
        this.loading = false;
        this.cdr.markForCheck();
      }
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

    const powerSeries: ChartDataPoint[] = this.transaction.meter_values.map((mv, index) => ({
      name: this.formatChartTime(mv.time || mv.timestamp, index),
      value: mv.power_rate / 1000
    }));

    this.chartData = [
      {name: 'Energy (kWh)', series: energySeries},
      {name: 'Power (kW)', series: powerSeries}
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
