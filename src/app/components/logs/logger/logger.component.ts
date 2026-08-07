import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { Message } from '../../../models/message';
import { Chargepoint } from '../../../models/chargepoint';
import { LoggerService } from '../../../service/logger.service';
import { ChargepointService } from '../../../service/chargepoint.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatMenu, MatMenuTrigger, MatMenuItem } from '@angular/material/menu';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { AsyncPipe } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { DateRange, getCurrentMonth, getLast7Days, getLast30Days, getToday } from '../../../helpers/date-ranges';

@Component({
  selector: 'app-logger',
  templateUrl: './logger.component.html',
  styleUrls: ['./logger.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    MatIconButton,
    MatButton,
    MatSuffix,
    MatIcon,
    MatSelect,
    MatOption,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatDatepickerToggle,
    MatDateRangePicker,
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
    MatCard,
    MatCardContent
  ]
})
export class LoggerComponent implements OnInit, AfterContentInit, OnDestroy {
  readonly logger = inject(LoggerService);
  private readonly chargepointService = inject(ChargepointService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  displayedColumn: string[] = ['time', 'feature', 'id', 'text'];
  filter: string = '';
  loading = false;
  dataSource = new MatTableDataSource<Message>();
  isOnline = false;

  // Server-side filters: the API returns only the newest records, so a period
  // outside that window is only reachable by asking the backend for it.
  startDate: Date | null = null;
  endDate: Date | null = null;
  chargePointFilter = '';
  chargePoints: Chargepoint[] = [];

  readonly predefinedRanges: { label: string, range: DateRange }[] = [
    { label: 'Today', range: getToday() },
    { label: 'Last 7 days', range: getLast7Days() },
    { label: 'Last 30 days', range: getLast30Days() },
    { label: 'Current month', range: getCurrentMonth() }
  ];

  // Mobile detection
  isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
    .pipe(map(result => result.matches));

  @ViewChild('logDataPaginator') set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }
  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  ngOnInit(): void {
    this.loading = true;
    this.logger.subscribeOnUpdates();

    this.logger.getMessages().pipe(
      takeUntil(this.destroy$)
    ).subscribe((messages) => {
      this.dataSource.data = messages;
      this.loading = false;
      this.cdr.markForCheck();
    });

    this.logger.isOnline$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.isOnline = status;
      this.cdr.markForCheck();
    });

    this.chargepointService.getChargePoints().pipe(
      takeUntil(this.destroy$)
    ).subscribe(points => {
      this.chargePoints = points ?? [];
      this.cdr.markForCheck();
    });
  }

  ngAfterContentInit(): void {
    const data = this.logger.currentMessages();
    if (data.length !== this.dataSource.data.length) {
      this.dataSource.data = data;
      this.loading = false;
    }
    this.cdr.markForCheck();
  }

  applyFilter(event: any): void {
    this.filter = event;
    this.dataSource.filter = this.filter.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  setRange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  // Reload the log from the API for the selected period and charge point.
  applyFilters(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.logger.reload({
      from: this.startDate ?? undefined,
      to: this.endDate ?? undefined,
      charge_point_id: this.chargePointFilter || undefined
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.dataSource.paginator?.firstPage();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  clearFilters(): void {
    this.startDate = null;
    this.endDate = null;
    this.chargePointFilter = '';
    this.applyFilters();
  }

  hasAdvancedFilters(): boolean {
    return !!(this.startDate || this.endDate || this.chargePointFilter);
  }

  // Exports what the table currently shows: the loaded period, narrowed by the
  // text filter.
  exportCsv(): void {
    const rows = this.dataSource.filteredData;
    if (!rows.length) return;

    const header = ['time', 'feature', 'charge_point_id', 'text'].join(',');
    const lines = rows.map(row => [row.time, row.feature, row.id, row.text]
      .map(value => this.csvCell(value))
      .join(','));
    const csv = [header, ...lines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.exportFilename();
    link.click();
    URL.revokeObjectURL(url);
  }

  private csvCell(value: string): string {
    const text = value ?? '';
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  private exportFilename(): string {
    const format = (date: Date) => new Intl.DateTimeFormat('en-CA').format(date);
    const charger = this.chargePointFilter ? `_${this.chargePointFilter}` : '';
    if (this.startDate && this.endDate) {
      return `system-log${charger}_${format(this.startDate)}_${format(this.endDate)}.csv`;
    }
    return `system-log${charger}_${format(new Date())}.csv`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.logger.onStop();
  }

  // Get paginated and filtered data for mobile view
  get paginatedData(): Message[] {
    const filtered = this.dataSource.filteredData;
    const paginator = this.dataSource.paginator;

    if (!paginator) {
      return filtered.slice(0, 10);
    }

    const startIndex = paginator.pageIndex * paginator.pageSize;
    return filtered.slice(startIndex, startIndex + paginator.pageSize);
  }

  // Format full datetime in European format: DD-MM-YYYY HH:mm:ss
  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    if (parts.length >= 2) {
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${parts[1]}`;
      }
    }
    return timeStr;
  }

  // Format time for mobile display (shorter format)
  formatTimeShort(timeStr: string): string {
    if (!timeStr) return '';
    // Assuming format like "2024-01-15 14:30:45"
    const parts = timeStr.split(' ');
    if (parts.length >= 2) {
      return parts[1]; // Return only time part
    }
    return timeStr;
  }

  // Format date for mobile display
  formatDateShort(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(' ');
    if (parts.length >= 1) {
      // Return date in shorter format DD-MM
      const dateParts = parts[0].split('-');
      if (dateParts.length === 3) {
        return `${dateParts[2]}-${dateParts[1]}`;
      }
    }
    return timeStr;
  }

  // Check if message contains error
  isErrorMessage(text: string): boolean {
    const message = text?.toLowerCase()
    return message.includes('error') || message.includes('fault');
  }
}
