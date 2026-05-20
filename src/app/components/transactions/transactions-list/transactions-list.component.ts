import {Component, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {map} from 'rxjs/operators';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker} from '@angular/material/datepicker';
import {FormsModule} from '@angular/forms';
import {MatIconButton, MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatMenu, MatMenuTrigger, MatMenuItem} from '@angular/material/menu';
import {ActivatedRoute, Router} from '@angular/router';
import {AsyncPipe, DecimalPipe, DatePipe} from '@angular/common';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltip} from '@angular/material/tooltip';
import {MatCheckbox} from '@angular/material/checkbox';

import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {TransactionService} from '../../../service/transaction.service';
import {ChargepointService} from '../../../service/chargepoint.service';
import {ErrorService} from '../../../service/error.service';
import {PaymentRetryService} from '../../../service/payment-retry.service';
import {TransactionListItem, calculateConsumed} from '../../../models/transaction-list-item';
import {TransactionFilter} from '../../../models/transaction-filter';
import {Chargepoint} from '../../../models/chargepoint';
import {DateRange, getLast12Months, getLast30Days, getTransactionRanges} from '../../../helpers/date-ranges';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatSelect,
    MatOption,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatDatepickerToggle,
    MatDateRangePicker,
    FormsModule,
    MatIconButton,
    MatButton,
    MatIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatSortHeader,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatNoDataRow,
    MatPaginator,
    AsyncPipe,
    DecimalPipe,
    DatePipe,
    MatExpansionModule,
    MatTooltip,
    MatCheckbox,
    TranslatePipe
  ]
})
export class TransactionsListComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly chargepointService = inject(ChargepointService);
  private readonly retryService = inject(PaymentRetryService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly errorService = inject(ErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  displayedColumns: string[] = [
    'transaction_id', 'id_tag', 'charge_point_id', 'connector_id',
    'time_start', 'time_stop', 'consumed',
    'payment_amount', 'actions'
  ];

  loading = false;
  dataSource = new MatTableDataSource<TransactionListItem>();
  showFirstLastButtons = true;

  // Filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  usernameFilter: string = '';
  idTagFilter: string = '';
  chargePointFilter: string = '';
  withErrorFilter: boolean = false;

  // Charge points for dropdown
  chargePoints: Chargepoint[] = [];

  // Transaction ids with an active payment retry
  private retryTxIds = new Set<number>();

  // Predefined date ranges
  predefinedRanges = getTransactionRanges();

  isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  @ViewChild('transactionPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  ngOnInit(): void {
    // Load charge points for filter dropdown
    this.chargepointService.getChargePoints().subscribe(points => {
      this.chargePoints = points;
      this.cdr.markForCheck();
    });

    // Load the payment retry queue to flag transactions with an active retry
    this.retryService.list().subscribe({
      next: (items) => {
        this.retryTxIds = new Set((items ?? []).map(i => i.transaction_id));
        this.cdr.markForCheck();
      },
      error: () => { /* non-fatal: indicator simply absent */ }
    });

    // Read query params for initial filtering
    const params = this.route.snapshot.queryParamMap;
    if (params.get('username')) {
      this.usernameFilter = params.get('username')!;
    }
    if (params.get('id_tag')) {
      this.idTagFilter = params.get('id_tag')!;
    }
    if (params.get('charge_point_id')) {
      this.chargePointFilter = params.get('charge_point_id')!;
    }

    // Set default date range based on filters
    // If username or id_tag filter is set, use last 12 months; otherwise use last 30 days
    const defaultRange = (this.usernameFilter || this.idTagFilter)
      ? getLast12Months()
      : getLast30Days();
    this.startDate = defaultRange.start;
    this.endDate = defaultRange.end;

    // Load initial data
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;

    const filter: TransactionFilter = {
      from: this.startDate,
      to: this.endDate,
      username: this.usernameFilter || undefined,
      id_tag: this.idTagFilter || undefined,
      charge_point_id: this.chargePointFilter || undefined,
      with_error: this.withErrorFilter || undefined
    };

    this.transactionService.getTransactionsList(filter).subscribe({
      next: (transactions) => {
        this.dataSource.data = transactions;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadFailed'));
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  setRange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  clearFilters(): void {
    this.usernameFilter = '';
    this.idTagFilter = '';
    this.chargePointFilter = '';
    this.withErrorFilter = false;
    this.setRange(getLast30Days());
    this.loadTransactions();
  }

  viewDetails(transactionId: number): void {
    this.router.navigate(['/transactions', transactionId]);
  }

  hasActiveRetry(transactionId: number): boolean {
    return this.retryTxIds.has(transactionId);
  }

  viewRetryQueue(): void {
    this.router.navigate(['/payment-retries']);
  }

  getConsumed(transaction: TransactionListItem): number {
    return calculateConsumed(transaction);
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss}`;
  }

  formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }

  hasActiveFilters(): boolean {
    return !!(this.usernameFilter || this.idTagFilter || this.chargePointFilter || this.withErrorFilter);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.usernameFilter) count++;
    if (this.idTagFilter) count++;
    if (this.chargePointFilter) count++;
    if (this.withErrorFilter) count++;
    return count;
  }

  get paginatedData(): TransactionListItem[] {
    const filtered = this.dataSource.filteredData;
    const paginator = this.dataSource.paginator;

    if (!paginator) {
      return filtered.slice(0, 10);
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(startIndex, startIndex + paginator.pageSize);
  }

  get totalConsumedKWh(): number {
    return this.dataSource.filteredData.reduce((sum, row) => sum + calculateConsumed(row), 0) / 1000;
  }
}
