import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatSort, MatSortHeader } from '@angular/material/sort';

import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

import { StatsService } from '../../../service/stats.service';
import { ChargepointService } from '../../../service/chargepoint.service';
import { StationUptime } from '../../../models/station-uptime';

interface ChartDataPoint {
  name: string;
  value: number;
}

@Component({
  selector: 'app-station-uptime',
  templateUrl: './station-uptime.component.html',
  styleUrl: './station-uptime.component.css',
  standalone: true,
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
    NgxChartsModule
  ]
})
export class StationUptimeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stations: StationUptime[] = [];
  loading = false;

  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedStation = '';

  chargePoints: { id: string; title: string }[] = [];

  chartData: ChartDataPoint[] = [];
  displayedColumns: string[] = ['charge_point_id', 'online_duration', 'offline_duration', 'uptime_percent', 'final_state'];

  averageUptime = 0;
  stationsAnalyzed = 0;

  predefinedRanges = [
    { label: 'Today', range: this.getToday() },
    { label: 'Last 7 Days', range: this.getLast7Days() },
    { label: 'Last 30 Days', range: this.getLast30Days() },
    { label: 'Current Month', range: this.getCurrentMonth() }
  ];

  colorScheme: Color = {
    name: 'uptime',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#4caf50', '#ff9800', '#f44336', '#3f51b5', '#9c27b0', '#00bcd4', '#795548', '#607d8b']
  };

  constructor(
    private statsService: StatsService,
    private chargepointService: ChargepointService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setRange(this.getLast30Days());
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
        }
      });
  }

  loadData(): void {
    this.loading = true;
    const chargePointId = this.selectedStation || undefined;

    this.statsService.getUptimeReport(this.startDate, this.endDate, chargePointId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.stations = data.sort((a, b) => a.charge_point_id.localeCompare(b.charge_point_id));
          this.transformChartData();
          this.calculateSummary();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private transformChartData(): void {
    this.chartData = this.stations
      .map(station => ({
        name: station.charge_point_id,
        value: station.uptime_percent
      }))
      .sort((a, b) => b.value - a.value);
  }

  private calculateSummary(): void {
    this.stationsAnalyzed = this.stations.length;
    if (this.stations.length > 0) {
      const totalUptime = this.stations.reduce((sum, s) => sum + s.uptime_percent, 0);
      this.averageUptime = totalUptime / this.stations.length;
    } else {
      this.averageUptime = 0;
    }
  }

  setRange(range: { start: Date; end: Date }): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  private getToday() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return { start, end };
  }

  private getLast7Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return { start, end };
  }

  private getLast30Days() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { start, end };
  }

  private getCurrentMonth() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  getUptimeClass(percent: number): string {
    if (percent >= 95) return 'high';
    if (percent >= 80) return 'medium';
    return 'low';
  }

  getStateClass(state: string): string {
    return state === 'ONLINE' ? 'online' : 'offline';
  }

  onStationChange(): void {
    this.loadData();
  }

  navigateToStation(chargePointId: string): void {
    this.router.navigate(['/points-info', { id: chargePointId }]);
  }
}
