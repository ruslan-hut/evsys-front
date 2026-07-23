import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTabGroup, MatTab, MatTabContent } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';
import { StationStatusComponent } from './station-status/station-status.component';
import { StationUptimeComponent } from './station-uptime/station-uptime.component';
import { PowerAnalysisComponent } from './power-analysis/power-analysis.component';
import { SmartChargingComponent } from './smart-charging/smart-charging.component';

/** Query-param values for each tab, in tab order. */
const TAB_KEYS = ['status', 'uptime', 'power', 'smart'] as const;

type TabKey = typeof TAB_KEYS[number];

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabGroup,
    MatTab,
    MatTabContent,
    StationStatusComponent,
    StationUptimeComponent,
    PowerAnalysisComponent,
    SmartChargingComponent,
    TranslatePipe
  ]
})
export class ReportsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  activeTabIndex = 0;

  /**
   * Tracks `?tab=` rather than reading it once, because the menu links here
   * from the reports page itself: the route does not change, so the component
   * is never re-created and a snapshot would miss the new tab.
   */
  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const index = TAB_KEYS.indexOf(params.get('tab') as TabKey);
        if (index >= 0 && index !== this.activeTabIndex) {
          this.activeTabIndex = index;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.activeTabIndex = index;
    // Keep the URL shareable, but replace rather than push so that going back
    // leaves the reports page instead of walking through every tab visited.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: TAB_KEYS[index] },
      replaceUrl: true
    });
  }
}
