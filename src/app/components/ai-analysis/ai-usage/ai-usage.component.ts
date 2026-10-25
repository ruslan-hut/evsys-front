import {ChangeDetectionStrategy, Component, OnInit, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe, KeyValuePipe} from '@angular/common';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatIcon} from '@angular/material/icon';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AIReportService} from '../../../service/ai-report.service';
import {ErrorService} from '../../../service/error.service';
import {AIUsageReport} from '../../../models/ai-report';

type UsageRange = 'month' | '90d' | '365d';

@Component({
  selector: 'app-ai-usage',
  templateUrl: './ai-usage.component.html',
  styleUrl: './ai-usage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, KeyValuePipe, MatProgressBar, MatButtonToggleGroup, MatButtonToggle, MatIcon, TranslatePipe],
})
export class AIUsageComponent implements OnInit {
  private readonly aiService = inject(AIReportService);
  private readonly errorService = inject(ErrorService);
  private readonly translate = inject(TranslateService);

  readonly ranges: UsageRange[] = ['month', '90d', '365d'];
  readonly range = signal<UsageRange>('month');
  readonly loading = signal(false);
  readonly usage = signal<AIUsageReport | null>(null);

  readonly records = computed(() => this.usage()?.records ?? []);
  readonly months = computed(() => this.usage()?.months ?? []);

  ngOnInit(): void {
    this.load();
  }

  setRange(range: UsageRange): void {
    this.range.set(range);
    this.load();
  }

  load(): void {
    const now = new Date();
    let from: Date;
    switch (this.range()) {
      case 'month':
        from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        break;
      case '90d':
        from = new Date(now.getTime() - 90 * 86_400_000);
        break;
      default:
        from = new Date(now.getTime() - 365 * 86_400_000);
    }
    this.loading.set(true);
    this.aiService.usage(from.toISOString().slice(0, 19) + 'Z', now.toISOString().slice(0, 19) + 'Z').subscribe({
      next: (usage) => {
        this.usage.set(usage);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorService.handle(this.translate.instant('aiAnalysis.errors.loadUsage'));
      },
    });
  }
}
