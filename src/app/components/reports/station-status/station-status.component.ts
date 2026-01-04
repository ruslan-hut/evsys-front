import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatIconButton, MatFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { StatsService } from '../../../service/stats.service';
import { StationStatus } from '../../../models/station-status';

@Component({
  selector: 'app-station-status',
  templateUrl: './station-status.component.html',
  styleUrl: './station-status.component.css',
  standalone: true,
  imports: [
    AsyncPipe,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatProgressBar,
    MatIconButton,
    MatFabButton,
    MatIcon,
    MatTooltip
  ]
})
export class StationStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stations: StationStatus[] = [];
  loading = false;

  onlineCount = 0;
  offlineCount = 0;

  isMobile$: Observable<boolean>;

  constructor(
    private statsService: StatsService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isMobile$ = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map(result => result.matches));
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.statsService.getStatusReport()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.stations = data.sort((a, b) => a.charge_point_id.localeCompare(b.charge_point_id));
          this.calculateSummary();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private calculateSummary(): void {
    this.onlineCount = this.stations.filter(s => s.state === 'ONLINE').length;
    this.offlineCount = this.stations.filter(s => s.state !== 'ONLINE').length;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  formatSince(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleString();
  }

  isOnline(station: StationStatus): boolean {
    return station.state === 'ONLINE';
  }

  refresh(): void {
    this.loadData();
  }
}
