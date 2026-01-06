import {Component, OnInit, ViewChild} from '@angular/core';
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

import {TransactionService} from '../../../service/transaction.service';
import {ChargepointService} from '../../../service/chargepoint.service';
import {ErrorService} from '../../../service/error.service';
import {TransactionListItem, calculateConsumed} from '../../../models/transaction-list-item';
import {TransactionFilter} from '../../../models/transaction-filter';
import {Chargepoint} from '../../../models/chargepoint';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css'],
  standalone: true,
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
    MatTooltip
  ]
})
export class TransactionsListComponent implements OnInit {
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

  // Charge points for dropdown
  chargePoints: Chargepoint[] = [];

  // Predefined date ranges
  predefinedRanges = [
    {label: 'Today', range: this.getToday()},
    {label: 'Current Month', range: this.getCurrentMonth()},
    {label: 'Previous Month', range: this.getPreviousMonth()},
    {label: 'Last 12 Months', range: this.getLast12Months()},
    {label: 'Current Year', range: this.getCurrentYear()}
  ];

  isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  @ViewChild('transactionPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor(
    private transactionService: TransactionService,
    private chargepointService: ChargepointService,
    private breakpointObserver: BreakpointObserver,
    private errorService: ErrorService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load charge points for filter dropdown
    this.chargepointService.getChargePoints().subscribe(points => {
      this.chargePoints = points;
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
      ? this.getLast12Months()
      : this.getLast30Days();
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
      charge_point_id: this.chargePointFilter || undefined
    };

    this.transactionService.getTransactionsList(filter).subscribe({
      next: (transactions) => {
        this.dataSource.data = transactions;
        this.loading = false;
      },
      error: () => {
        this.errorService.handle('Failed to load transactions');
        this.loading = false;
      }
    });
  }

  setRange(range: {start: Date; end: Date}): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  private getToday(): {start: Date; end: Date} {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return {start, end: start};
  }

  private getCurrentMonth(): {start: Date; end: Date} {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {start, end};
  }

  private getPreviousMonth(): {start: Date; end: Date} {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {start, end};
  }

  private getCurrentYear(): {start: Date; end: Date} {
    const date = new Date();
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear() + 1, 0, 0);
    return {start, end};
  }

  private getLast12Months(): {start: Date; end: Date} {
    const date = new Date();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const start = new Date(date.getFullYear(), date.getMonth() - 11, 1);
    return {start, end};
  }

  private getLast30Days(): {start: Date; end: Date} {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {start, end};
  }

  clearFilters(): void {
    this.usernameFilter = '';
    this.idTagFilter = '';
    this.chargePointFilter = '';
    this.setRange(this.getLast30Days());
    this.loadTransactions();
  }

  viewDetails(transactionId: number): void {
    this.router.navigate(['/transactions', transactionId]);
  }

  getConsumed(transaction: TransactionListItem): number {
    return calculateConsumed(transaction);
  }

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }

  hasActiveFilters(): boolean {
    return !!(this.usernameFilter || this.idTagFilter || this.chargePointFilter);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.usernameFilter) count++;
    if (this.idTagFilter) count++;
    if (this.chargePointFilter) count++;
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
