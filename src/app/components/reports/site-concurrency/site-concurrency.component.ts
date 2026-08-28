import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, DestroyRef
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {DatePipe, DecimalPipe} from '@angular/common';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {MatCard, MatCardContent} from '@angular/material/card';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatLabel, MatSuffix, MatHint} from '@angular/material/form-field';
import {
  MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker
} from '@angular/material/datepicker';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatMenuTrigger, MatMenu, MatMenuItem} from '@angular/material/menu';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatTooltip} from '@angular/material/tooltip';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {TranslatePipe} from '@ngx-translate/core';

import {StatsService} from '../../../service/stats.service';
import {ChargepointService} from '../../../service/chargepoint.service';
import {SiteConcurrency, ConcurrencyLevel} from '../../../models/site-concurrency';
import {ChargingLocation} from '../../../models/charging-location';
import {DateRange, getLast7Days, getUptimeRanges} from '../../../helpers/date-ranges';

const ALL_LOCATIONS = '';

/** A level with the width it should occupy in the breakdown bar. */
interface LevelBar extends ConcurrencyLevel {
  percent: number,
}

/** A site row with the derived values the template needs. */
interface SiteRow {
  site: SiteConcurrency,
  bars: LevelBar[],
  /** Share of the window with two or more sessions charging. */
  overlapPercent: number,
}

@Component({
  selector: 'app-site-concurrency',
  templateUrl: './site-concurrency.component.html',
  styleUrl: './site-concurrency.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    MatCard, MatCardContent, MatProgressBar, MatButton, MatIconButton, MatIcon,
    MatFormField, MatLabel, MatSuffix, MatHint,
    MatDateRangeInput, MatStartDate, MatEndDate, MatDatepickerToggle, MatDateRangePicker,
    MatSelect, MatOption, MatMenuTrigger, MatMenu, MatMenuItem,
    MatSlideToggle, MatTooltip,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
    TranslatePipe
  ]
})
export class SiteConcurrencyComponent implements OnInit {
  private readonly statsService = inject(StatsService);
  private readonly chargePointService = inject(ChargepointService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly allLocations = ALL_LOCATIONS;
  loading = false;

  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedLocation = ALL_LOCATIONS;

  /**
   * Off lists only the stretches where sessions overlapped, which is what the
   * report is usually read for. On asks for min_sessions=1, the whole timeline
   * including the stretches with a single car.
   */
  wholeTimeline = false;

  locations: ChargingLocation[] = [];
  rows: SiteRow[] = [];

  predefinedRanges = getUptimeRanges();

  ngOnInit(): void {
    this.setRange(getLast7Days());
    this.loadLocations();
    this.loadData();
  }

  /**
   * Location names for the filter. A failure here must not blank the report,
   * which falls back to the location id it already carries.
   */
  private loadLocations(): void {
    this.chargePointService.getLocations()
      .pipe(catchError(() => of([])), takeUntilDestroyed(this.destroyRef))
      .subscribe(locations => {
        this.locations = locations;
        this.cdr.markForCheck();
      });
  }

  loadData(): void {
    this.loading = true;
    this.statsService
      .getConcurrencyReport(
        this.startDate,
        this.endDate,
        this.selectedLocation || undefined,
        this.wholeTimeline ? 1 : undefined
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: data => {
          this.rows = (data || []).map(site => this.toRow(site));
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.rows = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private toRow(site: SiteConcurrency): SiteRow {
    const levels = site.levels || [];
    const total = levels.reduce((sum, l) => sum + l.seconds, 0);
    return {
      site,
      bars: levels.map(l => ({...l, percent: total > 0 ? (100 * l.seconds) / total : 0})),
      overlapPercent: total > 0 ? (100 * site.overlap_seconds) / total : 0
    };
  }

  setRange(range: DateRange): void {
    this.startDate = range.start;
    this.endDate = range.end;
  }

  onFilterChange(): void {
    this.loadData();
  }

  siteName(site: SiteConcurrency): string {
    return site.location_name || site.location_id;
  }

  /** Watts read as kilowatts once they run to thousands, which they do. */
  formatPower(watts: number): string {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`;
    }
    return `${Math.round(watts)} W`;
  }

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
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  /**
   * Levels are ordinal, so the shade carries the count: idle is flat, and a
   * busier site reads darker. Beyond the fourth they share the darkest step
   * rather than inventing new hues.
   */
  levelClass(sessions: number): string {
    if (sessions === 0) return 'level-idle';
    return `level-${Math.min(sessions, 4)}`;
  }

  /** A session with no recorded limit is shown as such rather than as 0 A. */
  hasLimit(amps: number): boolean {
    return amps > 0;
  }
}
