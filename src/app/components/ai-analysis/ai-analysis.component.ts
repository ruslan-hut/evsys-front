import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {MatTab, MatTabContent, MatTabGroup} from '@angular/material/tabs';
import {TranslatePipe} from '@ngx-translate/core';
import {AISettingsComponent} from './ai-settings/ai-settings.component';
import {AIReportsComponent} from './ai-reports/ai-reports.component';
import {AIUsageComponent} from './ai-usage/ai-usage.component';

/** Query-param values for each tab, in tab order. */
const TAB_KEYS = ['reports', 'settings', 'usage'] as const;

type TabKey = typeof TAB_KEYS[number];

/** Admin page of the weekly AI analysis: its reports, settings and spend. */
@Component({
  selector: 'app-ai-analysis',
  templateUrl: './ai-analysis.component.html',
  styleUrl: './ai-analysis.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabGroup, MatTab, MatTabContent, AISettingsComponent, AIReportsComponent, AIUsageComponent, TranslatePipe],
})
export class AIAnalysisComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeTabIndex = signal(0);

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const index = TAB_KEYS.indexOf(params.get('tab') as TabKey);
        if (index >= 0) {
          this.activeTabIndex.set(index);
        }
      });
  }

  onTabChange(index: number): void {
    this.activeTabIndex.set(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {tab: TAB_KEYS[index]},
      replaceUrl: true,
    });
  }
}
