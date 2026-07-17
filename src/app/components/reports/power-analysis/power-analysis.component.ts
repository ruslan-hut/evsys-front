import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';

import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatSuffix, MatHint } from '@angular/material/form-field';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription } from '@angular/material/expansion';
import {
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
  MatNoDataRow
} from '@angular/material/table';
import { MatSort, MatSortHeader, Sort } from '@angular/material/sort';

import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { StatsService } from '../../../service/stats.service';
import { ChargepointService } from '../../../service/chargepoint.service';
import { PowerGroupBy, PowerStats } from '../../../models/power-stats';
import { Group } from '../../../models/group';
import { DateRange, getLast7Days, getPowerRanges } from '../../../helpers/date-ranges';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}

/** Which breakdown the report is showing. 'timeline' resolves to hour or day. */
type PowerView = 'timeline' | 'charger' | 'session';

type TimelineBucket = Extract<PowerGroupBy, 'hour' | 'day'>;

@Component({
  selector: 'app-power-analysis',
  templateUrl: './power-analysis.component.html',
  styleUrl: './power-analysis.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatProgressBar,
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSuffix,
    MatHint,
    MatDateRangeInput,
    MatStartDate,
    MatEndDate,
    MatDatepickerToggle,
    MatDateRangePicker,
    MatSelect,
    MatOption,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatPaginator,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
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
    MatNoDataRow,
    MatSort,
    MatSortHeader,
    NgxChartsModule,
    TranslatePipe
  ]
})
export class PowerAnalysisComponent implements OnInit, OnDestroy {
  private readonly statsService = inject(StatsService);
  private readonly chargepointService = inject(ChargepointService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  rows: PowerStats[] = [];
  loading = false;

  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedStation = '';
  selectedGroup = '';
  view: PowerView = 'timeline';
  bucket: TimelineBucket = 'hour';

  chargePoints: { id: string; title: string }[] = [];
  groups: Group[] = this.statsService.getGroups();

  predefinedRanges = getPowerRanges();

  energyChart: ChartDataPoint[] = [];
  loadChart: ChartSeries[] = [];
  chargerChart: ChartSeries[] = [];

  /**
   * Position of each bucket label, used to thin out axis ticks. A week of
   * hourly buckets is 168 points, and ngx-charts will happily render all 168
   * labels on top of one another.
   */
  private labelIndex = new Map<string, number>();
  private tickStride = 1;

  pageIndex = 0;
  pageSize = 25;
  readonly pageSizeOptions = [10, 25, 50, 100];

  /**
   * Below, not the default right: the responsive `svg { width: 100% }` override
   * these chart cards rely on pushes a right-hand legend out of the card. The
   * dashboard solves it the same way.
   */
  legendPosition = LegendPosition.Below;

  /** Multi-hue, for the charts where colour separates real series. */
  colorScheme: Color = {
    name: 'power',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5', '#ff9800', '#4caf50', '#e91e63', '#00bcd4', '#9c27b0', '#795548', '#607d8b']
  };

  /**
   * Single-hue, for the energy timeline. Every bar there is the same quantity
   * in a different hour, so an ordinal scheme would cycle the palette and imply
   * a grouping that does not exist. One series, one colour.
   */
  energyColorScheme: Color = {
    name: 'energy',
    selectable: false,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5']
  };

  ngOnInit(): void {
    this.setRange(getLast7Days());
    this.loadChargePoints();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadChargePoints(): void {
    this.chargepointService.getChargePoints()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: points => {
          this.chargePoints = points.map(p => ({ id: p.charge_point_id || '', title: p.title || p.charge_point_id || '' }));
          this.cdr.markForCheck();
        }
      });
  }

  loadData(): void {
    this.loading = true;
    const groupBy: PowerGroupBy = this.view === 'timeline' ? this.bucket : this.view;

    this.statsService.getPowerReport(
      this.startDate,
      this.endDate,
      groupBy,
      this.selectedStation || undefined,
      this.selectedGroup || undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.rows = data ?? [];
          this.pageIndex = 0;
          this.buildCharts();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.rows = [];
          this.energyChart = [];
          this.loadChart = [];
          this.chargerChart = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  get isTimeline(): boolean {
    return this.view === 'timeline';
  }

  // --- Summary -------------------------------------------------------------

  /**
   * Peak power in kW. For the timeline this is the highest concurrent draw
   * across the fleet; for the other views it is the highest single session.
   */
  get peakPowerKw(): number {
    return this.rows.reduce((max, row) => Math.max(max, row.max_power), 0) / 1000;
  }

  get totalEnergyKWh(): number {
    return this.rows.reduce((sum, row) => sum + row.total_consumed, 0) / 1000;
  }

  /**
   * Re-aggregates the rows' charging averages by sample count rather than
   * averaging the averages, which would let a bucket with two samples weigh as
   * much as one with two hundred.
   */
  get avgChargingPowerKw(): number {
    const samples = this.rows.reduce((sum, row) => sum + row.samples, 0);
    if (samples === 0) {
      return 0;
    }
    const weighted = this.rows.reduce((sum, row) => sum + row.avg_charging_power * row.samples, 0);
    return weighted / samples / 1000;
  }

  /**
   * Only meaningful off the timeline: a session spanning several buckets is
   * counted in each, so the timeline's session column does not sum.
   */
  get totalSessions(): number {
    return this.rows.reduce((sum, row) => sum + row.sessions, 0);
  }

  /** Hours the fleet spent actually charging, across the loaded rows. */
  get chargingHours(): number {
    return this.rows.reduce((sum, row) => sum + row.duration_seconds, 0) / 3600;
  }

  // --- Charts --------------------------------------------------------------

  private buildCharts(): void {
    this.energyChart = [];
    this.loadChart = [];
    this.chargerChart = [];

    if (this.rows.length === 0) {
      return;
    }

    if (this.isTimeline) {
      // Aim for ~12 visible ticks regardless of range length.
      this.labelIndex = new Map(this.rows.map((row, i) => [this.bucketLabel(row), i]));
      this.tickStride = Math.max(1, Math.ceil(this.rows.length / 12));

      this.energyChart = this.rows.map(row => ({
        name: this.bucketLabel(row),
        value: row.total_consumed / 1000
      }));
      this.loadChart = [
        {
          name: this.translate.instant('reports.power.series.peak'),
          series: this.rows.map(row => ({ name: this.bucketLabel(row), value: row.max_power / 1000 }))
        },
        {
          name: this.translate.instant('reports.power.series.average'),
          series: this.rows.map(row => ({ name: this.bucketLabel(row), value: row.avg_charging_power / 1000 }))
        }
      ];
      return;
    }

    if (this.view === 'charger') {
      // Grouped bars compare peak against average per charger; both are kW, so
      // sharing one axis is honest here.
      this.chargerChart = this.rows.map(row => ({
        name: row.charge_point_id || '',
        series: [
          { name: this.translate.instant('reports.power.series.peak'), value: row.max_power / 1000 },
          { name: this.translate.instant('reports.power.series.charging'), value: row.avg_charging_power / 1000 },
          { name: this.translate.instant('reports.power.series.session'), value: row.avg_session_power / 1000 }
        ]
      }));
    }
  }

  /**
   * Thins and shortens the time axis. The series names have to stay unique and
   * fully qualified for ngx-charts to key on, so the labels are only trimmed
   * here at render time, and blanked entirely between strides.
   */
  xAxisTickFormatting = (label: string): string => {
    const index = this.labelIndex.get(label);
    if (index === undefined || index % this.tickStride !== 0) {
      return '';
    }
    // Drop the year: the selected period is already shown above the charts.
    return label.replace(/^\d{4}-/, '');
  };

  /** Bucket labels must be unique or ngx-charts collapses points onto one another. */
  private bucketLabel(row: PowerStats): string {
    if (this.bucket === 'day') {
      return row.date ?? '';
    }
    const hour = (row.hour ?? 0).toString().padStart(2, '0');
    return `${row.date ?? ''} ${hour}:00`;
  }

  // --- Table ---------------------------------------------------------------

  get displayedColumns(): string[] {
    if (this.isTimeline) {
      return ['bucket', 'sessions', 'total_consumed', 'avg_charging_power', 'max_power'];
    }
    if (this.view === 'session') {
      return ['transaction_id', 'charge_point_id', 'total_consumed', 'duration_seconds', 'avg_charging_power', 'avg_session_power', 'max_power'];
    }
    return ['charge_point_id', 'sessions', 'total_consumed', 'avg_charging_power', 'avg_session_power', 'max_power'];
  }

  get pagedRows(): PowerStats[] {
    const start = this.pageIndex * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSortChange(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    this.rows = [...this.rows].sort((a, b) => dir * this.compareRows(a, b, sort.active));
    this.pageIndex = 0;
  }

  private compareRows(a: PowerStats, b: PowerStats, column: string): number {
    switch (column) {
      case 'bucket':
        return this.bucketLabel(a).localeCompare(this.bucketLabel(b));
      case 'charge_point_id':
        return (a.charge_point_id ?? '').localeCompare(b.charge_point_id ?? '');
      case 'transaction_id':
        return (a.transaction_id ?? 0) - (b.transaction_id ?? 0);
      case 'sessions':
        return a.sessions - b.sessions;
      case 'total_consumed':
        return a.total_consumed - b.total_consumed;
      case 'duration_seconds':
        return a.duration_seconds - b.duration_seconds;
      case 'avg_charging_power':
        return a.avg_charging_power - b.avg_charging_power;
      case 'avg_session_power':
        return a.avg_session_power - b.avg_session_power;
      case 'max_power':
        return a.max_power - b.max_power;
      default:
        return 0;
    }
  }

  rowLabel(row: PowerStats): string {
    return this.isTimeline ? this.bucketLabel(row) : (row.charge_point_id ?? '');
  }

  trackRow = (_: number, row: PowerStats): string =>
    `${row.transaction_id ?? ''}|${row.charge_point_id ?? ''}|${row.date ?? ''}|${row.hour ?? ''}`;

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  setRange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  onViewChange(): void {
    this.loadData();
  }

  navigateToTransaction(transactionId: number | undefined): void {
    if (transactionId) {
      this.router.navigate(['/transactions', transactionId]);
    }
  }

  navigateToStation(chargePointId: string | undefined): void {
    if (chargePointId) {
      this.router.navigate(['/points-info', { id: chargePointId }]);
    }
  }
}
