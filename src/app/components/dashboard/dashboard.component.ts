import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';

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
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { NgxChartsModule, Color, ScaleType, LegendPosition } from '@swimlane/ngx-charts';

import { StatsService } from '../../service/stats.service';
import { MonthStats } from '../../models/month-stats';
import { UserStats } from '../../models/user-stats';
import { Group } from '../../models/group';

interface ChartDataPoint {
  name: string;
  value: number;
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
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
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
    MatProgressSpinner,
    NgxChartsModule
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  monthStats: MonthStats[] = [];
  userStats: UserStats[] = [];
  chargerStats: UserStats[] = [];

  groups: Group[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedGroup = '';
  activeTabIndex = 0;
  inProgress = false;

  private loadingCount = 0;

  predefinedRanges = [
    { label: 'Today', range: this.getToday() },
    { label: 'Current Month', range: this.getCurrentMonth() },
    { label: 'Previous Month', range: this.getPreviousMonth() },
    { label: 'Current Year', range: this.getCurrentYear() },
    { label: 'Last Year', range: this.getLastYear() }
  ];

  monthLineChartData: ChartSeries[] = [];
  monthBarChartData: ChartDataPoint[] = [];
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

  constructor(private statsService: StatsService) {}

  ngOnInit(): void {
    this.groups = this.statsService.getGroups();
    this.selectedGroup = 'default'; // Client group
    this.setRange(this.getLastYear());
    this.requestData();
  }

  private getLastYear() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return { start, end };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRange(range: { start: Date; end: Date }): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  private getPreviousMonth() {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  private getCurrentMonth() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  private getCurrentYear() {
    const date = new Date();
    const start = new Date(date.getFullYear(), 0, 1);
    const end = new Date(date.getFullYear() + 1, 0, 0);
    return { start, end };
  }

  private getToday() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = start;
    return { start, end };
  }

  requestData(): void {
    this.inProgress = true;
    this.loadingCount = 3;
    this.fetchMonthData();
    this.fetchUserData();
    this.fetchChargerData();
  }

  private fetchMonthData(): void {
    this.statsService.getMonthlyReport(this.startDate, this.endDate, this.selectedGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.monthStats = data;
          this.transformMonthData();
          this.checkLoadingComplete();
        },
        error: () => this.checkLoadingComplete()
      });
  }

  private fetchUserData(): void {
    this.statsService.getUserReport(this.startDate, this.endDate, this.selectedGroup)
      .pipe(takeUntil(this.destroy$))
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
    this.statsService.getChargerReport(this.startDate, this.endDate, this.selectedGroup)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.chargerStats = data;
          this.transformChargerData();
          this.checkLoadingComplete();
        },
        error: () => this.checkLoadingComplete()
      });
  }

  private checkLoadingComplete(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.inProgress = false;
      // Trigger resize to recalculate chart dimensions
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    }
  }

  private transformMonthData(): void {
    this.monthLineChartData = [
      {
        name: 'Avg kWh/Session',
        series: this.monthStats.map(stat => ({
          name: this.getMonthName(stat.month) + ' ' + stat.year,
          value: stat.average / 1000
        }))
      },
      {
        name: 'Sessions',
        series: this.monthStats.map(stat => ({
          name: this.getMonthName(stat.month) + ' ' + stat.year,
          value: stat.count
        }))
      }
    ];

    this.monthBarChartData = this.monthStats.map(stat => ({
      name: this.getMonthName(stat.month) + ' ' + stat.year,
      value: stat.total / 1000
    }));

    const totalWatts = this.monthStats.reduce((sum, s) => sum + s.total, 0);
    const totalCount = this.monthStats.reduce((sum, s) => sum + s.count, 0);
    this.monthSummary = {
      totalKWh: totalWatts / 1000,
      totalSessions: totalCount,
      averageKWh: totalCount > 0 ? (totalWatts / totalCount) / 1000 : 0
    };
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

  private getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
  }
}
