import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe, PercentPipe } from '@angular/common';

import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatFormField, MatLabel, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker } from '@angular/material/datepicker';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSlideToggle } from '@angular/material/slide-toggle';

import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';
import { TranslatePipe } from '@ngx-translate/core';
import { DateRange, getDashboardRanges, getLastYear, previousYearRange } from '../../helpers/date-ranges';
import { LanguageService } from '../../service/language.service';

import { StatsService } from '../../service/stats.service';
import { MonthStats } from '../../models/month-stats';
import { UserStats } from '../../models/user-stats';
import { Group } from '../../models/group';
import { BarLineChartComponent } from '../ui/bar-line-chart/bar-line-chart.component';

interface ChartDataPoint {
  name: string;
  value: number;
  /** Tooltip note naming the period a comparison point really stands for. */
  extra?: { label: string };
}

interface ChartSeries {
  name: string;
  series: ChartDataPoint[];
}

interface SummaryMetrics {
  totalKWh: number;
  totalSessions: number;
  averageKWh: number;
  count?: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    PercentPipe,
    MatCard, MatCardContent, MatCardHeader, MatCardTitle,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
    MatTabGroup, MatTab,
    MatFormField, MatLabel, MatHint, MatSuffix,
    MatDateRangeInput, MatStartDate, MatEndDate,
    MatDatepickerToggle, MatDateRangePicker,
    MatSelect, MatOption,
    MatButton, MatIconButton,
    MatIcon,
    MatMenuTrigger, MatMenu, MatMenuItem,
    MatProgressBar,
    MatSlideToggle,
    NgxChartsModule,
    BarLineChartComponent,
    TranslatePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  monthStats: MonthStats[] = [];
  previousYearStats: MonthStats[] = [];
  userStats: UserStats[] = [];
  chargerStats: UserStats[] = [];

  groups: Group[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedGroup = '';
  activeTabIndex = 0;
  inProgress = false;
  /** Overlays each month with the same month a year earlier. */
  comparePreviousYear = false;

  private loadingCount = 0;

  /**
   * The range and group the monthly figures on screen were fetched for. The
   * filter inputs are bound live but only applied on "Load data", so toggling
   * the comparison has to follow the chart rather than the inputs - otherwise
   * an edited, unloaded date range would fetch a previous year that does not
   * line up with the bars beside it.
   */
  private monthRange: DateRange = { start: new Date(), end: new Date() };
  private monthGroup = '';

  predefinedRanges = getDashboardRanges();

  monthLineChartData: ChartSeries[] = [];
  monthBarChartData: ChartDataPoint[] = [];
  /** Previous-year values, keyed by the current month they are compared with. */
  monthPreviousYearData: ChartDataPoint[] = [];
  /**
   * How far the read period sits above or below the same period a year
   * earlier, as a ratio. Covers only the months both years have figures for -
   * the same months the chart draws - so the headline agrees with the picture.
   * Null when nothing lines up, or when the previous year total is zero.
   */
  comparisonDelta: number | null = null;
  userBarChartData: ChartDataPoint[] = [];
  userPieChartData: ChartDataPoint[] = [];
  chargerBarChartData: ChartDataPoint[] = [];
  chargerPieChartData: ChartDataPoint[] = [];

  monthSummary: SummaryMetrics = { totalKWh: 0, totalSessions: 0, averageKWh: 0 };
  userSummary: SummaryMetrics = { totalKWh: 0, totalSessions: 0, averageKWh: 0, count: 0 };
  chargerSummary: SummaryMetrics = { totalKWh: 0, totalSessions: 0, averageKWh: 0, count: 0 };

  colorScheme: Color = {
    name: 'custom',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#3f51b5', '#e91e63', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b']
  };

  legendPosition = LegendPosition.Below;

  ngOnInit(): void {
    this.groups = this.statsService.getGroups();
    this.selectedGroup = 'default'; // Client group
    this.setRange(getLastYear());
    this.requestData();
  }

  setRange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  requestData(): void {
    this.fetchMonthData();
    this.fetchUserData();
    this.fetchChargerData();
  }

  /**
   * Fetches the previous year on demand rather than with every load: it is a
   * second round trip that most sessions never look at.
   */
  onComparePreviousYearChange(enabled: boolean): void {
    this.comparePreviousYear = enabled;
    if (enabled) {
      this.fetchPreviousYearData();
      return;
    }
    this.previousYearStats = [];
    this.monthPreviousYearData = [];
    this.comparisonDelta = null;
  }

  private fetchMonthData(): void {
    this.monthRange = { start: this.startDate, end: this.endDate };
    this.monthGroup = this.selectedGroup;
    this.beginLoading();
    this.statsService.getMonthlyReport(this.monthRange.start, this.monthRange.end, this.monthGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.monthStats = data;
          this.transformMonthData();
          this.checkLoadingComplete();
        },
        error: () => this.checkLoadingComplete()
      });
    if (this.comparePreviousYear) {
      this.fetchPreviousYearData();
    }
  }

  private fetchPreviousYearData(): void {
    const range = previousYearRange(this.monthRange);
    this.beginLoading();
    this.statsService.getMonthlyReport(range.start, range.end, this.monthGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.previousYearStats = data;
          this.transformPreviousYearData();
          this.checkLoadingComplete();
        },
        // Dropping the old figures rather than keeping them: they belong to a
        // period that is no longer the one the bars show.
        error: () => {
          this.previousYearStats = [];
          this.transformPreviousYearData();
          this.checkLoadingComplete();
        }
      });
  }

  private fetchUserData(): void {
    this.beginLoading();
    this.statsService.getUserReport(this.startDate, this.endDate, this.selectedGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.userStats = data;
          this.transformUserData();
          this.checkLoadingComplete();
        },
        error: () => this.checkLoadingComplete()
      });
  }

  private fetchChargerData(): void {
    this.beginLoading();
    this.statsService.getChargerReport(this.startDate, this.endDate, this.selectedGroup)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.chargerStats = data;
          this.transformChargerData();
          this.checkLoadingComplete();
        },
        error: () => this.checkLoadingComplete()
      });
  }

  private beginLoading(): void {
    this.loadingCount++;
    this.inProgress = true;
  }

  private checkLoadingComplete(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.inProgress = false;
      this.cdr.markForCheck();
      // Trigger resize to recalculate chart dimensions
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
  }

  private transformMonthData(): void {
    this.monthLineChartData = [
      {
        name: 'Avg kWh/Session',
        series: this.monthStats.map(stat => ({
          name: this.monthLabel(stat.month, stat.year),
          value: stat.average / 1000
        }))
      },
      {
        name: 'Sessions',
        series: this.monthStats.map(stat => ({
          name: this.monthLabel(stat.month, stat.year),
          value: stat.count
        }))
      }
    ];

    this.monthBarChartData = this.monthStats.map(stat => ({
      name: this.monthLabel(stat.month, stat.year),
      value: stat.total / 1000
    }));

    // The comparison is plotted against the months on screen, so it has to be
    // rebuilt whenever those change.
    this.transformPreviousYearData();

    const totalWatts = this.monthStats.reduce((sum, s) => sum + s.total, 0);
    const totalCount = this.monthStats.reduce((sum, s) => sum + s.count, 0);
    this.monthSummary = {
      totalKWh: totalWatts / 1000,
      totalSessions: totalCount,
      averageKWh: totalCount > 0 ? (totalWatts / totalCount) / 1000 : 0
    };
  }

  /**
   * Plots each previous-year month at the position of the month it is compared
   * with. A month the previous year has no figures for is left out rather than
   * plotted as zero, so the line breaks instead of claiming no consumption.
   */
  private transformPreviousYearData(): void {
    const points: ChartDataPoint[] = [];
    let current = 0;
    let previousTotal = 0;

    for (const stat of this.monthStats) {
      const previous = this.previousYearStats.find(p => p.year === stat.year - 1 && p.month === stat.month);
      if (!previous) {
        continue;
      }
      points.push({
        name: this.monthLabel(stat.month, stat.year),
        value: previous.total / 1000,
        extra: { label: this.monthLabel(previous.month, previous.year) }
      });
      current += stat.total;
      previousTotal += previous.total;
    }

    this.monthPreviousYearData = points;
    this.comparisonDelta = previousTotal > 0 ? (current - previousTotal) / previousTotal : null;
  }

  private transformUserData(): void {
    const sorted = [...this.userStats].sort((a, b) => b.total - a.total).slice(0, 10);

    this.userBarChartData = sorted.map(stat => ({
      name: stat.user,
      value: stat.total / 1000
    }));

    this.userPieChartData = sorted.map(stat => ({
      name: stat.user,
      value: stat.total / 1000
    }));

    const totalWatts = this.userStats.reduce((sum, s) => sum + s.total, 0);
    const totalCount = this.userStats.reduce((sum, s) => sum + s.count, 0);
    this.userSummary = {
      totalKWh: totalWatts / 1000,
      totalSessions: totalCount,
      averageKWh: totalCount > 0 ? (totalWatts / totalCount) / 1000 : 0,
      count: this.userStats.length
    };
  }

  private transformChargerData(): void {
    const sorted = [...this.chargerStats].sort((a, b) => b.total - a.total).slice(0, 10);

    this.chargerBarChartData = sorted.map(stat => ({
      name: stat.user,
      value: stat.total / 1000
    }));

    this.chargerPieChartData = sorted.map(stat => ({
      name: stat.user,
      value: stat.total / 1000
    }));

    const totalWatts = this.chargerStats.reduce((sum, s) => sum + s.total, 0);
    const totalCount = this.chargerStats.reduce((sum, s) => sum + s.count, 0);
    this.chargerSummary = {
      totalKWh: totalWatts / 1000,
      totalSessions: totalCount,
      averageKWh: totalCount > 0 ? (totalWatts / totalCount) / 1000 : 0,
      count: this.chargerStats.length
    };
  }

  private monthLabel(month: number, year: number): string {
    return this.getMonthName(month) + ' ' + year;
  }

  private getMonthName(month: number): string {
    if (month < 1 || month > 12) {
      return '';
    }
    const locale = this.languageService.current === 'es' ? 'es-ES' : 'en-GB';
    const date = new Date(2000, month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date);
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }
}
