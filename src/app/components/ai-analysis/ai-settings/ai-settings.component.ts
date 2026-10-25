import {ChangeDetectionStrategy, Component, OnInit, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatHint, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatDivider} from '@angular/material/divider';
import {MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AIReportService} from '../../../service/ai-report.service';
import {ErrorService} from '../../../service/error.service';
import {LanguageService} from '../../../service/language.service';
import {AIReportSettingsUpdate, AIReportSettingsView, AIUsage} from '../../../models/ai-report';
import {explainRequestError} from '../ai-errors';

const REASONING_EFFORTS = ['', 'minimal', 'low', 'medium', 'high'];
const HOURS = Array.from({length: 24}, (_, h) => h);
/** Monday first, as operators read a week; values are JS weekdays (0 = Sunday). */
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

@Component({
  selector: 'app-ai-settings',
  templateUrl: './ai-settings.component.html',
  styleUrl: './ai-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, DatePipe, DecimalPipe,
    MatProgressBar, MatFormField, MatLabel, MatHint, MatSuffix, MatInput, MatSelect, MatOption,
    MatSlideToggle, MatButton, MatIcon, MatDivider,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription,
    MatCard, MatCardContent,
    TranslatePipe,
  ],
})
export class AISettingsComponent implements OnInit {
  private readonly aiService = inject(AIReportService);
  private readonly errorService = inject(ErrorService);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly efforts = REASONING_EFFORTS;
  readonly hours = HOURS;
  readonly weekdays = WEEKDAYS;

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly testing = signal(false);
  readonly view = signal<AIReportSettingsView | null>(null);
  readonly testResult = signal<AIUsage | null>(null);

  readonly budgetShare = computed(() => {
    const v = this.view();
    if (!v || v.monthly_budget_usd <= 0) return null;
    return Math.min(100, (v.month_spent_usd / v.monthly_budget_usd) * 100);
  });

  readonly form = this.fb.nonNullable.group({
    enabled: [true],
    model: ['', Validators.required],
    reasoning_effort: [''],
    max_output_tokens: [8000, [Validators.required, Validators.min(1000), Validators.max(64000)]],
    weekday: [1, Validators.required],
    hour: [7, Validators.required],
    time_zone: ['Europe/Madrid', [Validators.required, Validators.maxLength(64)]],
    period_days: [7, [Validators.required, Validators.min(1), Validators.max(31)]],
    monthly_budget_usd: [0, [Validators.required, Validators.min(0)]],
    system_prompt: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  /** Loads the settings; with keepForm the edits in progress are left alone. */
  load(keepForm = false): void {
    this.loading.set(true);
    this.aiService.settings().subscribe({
      next: (view) => {
        if (keepForm) {
          this.view.set(view);
        } else {
          this.apply(view);
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorService.handle(this.translate.instant('aiAnalysis.errors.loadSettings'));
        this.loading.set(false);
      },
    });
  }

  private apply(view: AIReportSettingsView): void {
    this.view.set(view);
    this.form.reset({
      enabled: view.enabled,
      model: view.model,
      reasoning_effort: view.reasoning_effort ?? '',
      max_output_tokens: view.max_output_tokens,
      weekday: view.weekday,
      hour: view.hour,
      time_zone: view.time_zone,
      period_days: view.period_days,
      monthly_budget_usd: view.monthly_budget_usd,
      // the editor always shows the prompt in force
      system_prompt: view.system_prompt || view.default_system_prompt,
    });
  }

  /** The next run as the schedule sees it, in the schedule's time zone. */
  nextRun(v: AIReportSettingsView): {day: string; time: string; zone: string} | null {
    if (!v.next_run) return null;
    const at = new Date(v.next_run);
    try {
      const day = new Intl.DateTimeFormat(this.language.current, {
        weekday: 'long', day: 'numeric', month: 'long', timeZone: v.time_zone,
      }).format(at);
      const time = new Intl.DateTimeFormat(this.language.current, {
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: v.time_zone,
      }).format(at);
      return {day, time, zone: v.time_zone};
    } catch {
      return {day: v.next_run, time: '', zone: v.time_zone};
    }
  }

  /** A stored model that left the price list still shows in the picker. */
  modelListed(v: AIReportSettingsView): boolean {
    return v.models.some(m => m.id === v.model);
  }

  /** Name of a JS weekday in the interface language. */
  weekdayName(day: number): string {
    // 2026-11-01 is a Sunday
    const date = new Date(Date.UTC(2026, 10, 1 + day));
    return new Intl.DateTimeFormat(this.language.current, {weekday: 'long', timeZone: 'UTC'}).format(date);
  }

  openRecipients(): void {
    this.router.navigateByUrl('/mail-subscriptions');
  }

  modelPrice(id: string): string {
    const m = this.view()?.models.find(o => o.id === id);
    if (!m) return '';
    return this.translate.instant('aiAnalysis.settings.modelPrice', {
      input: m.input_price.toFixed(2),
      output: m.output_price.toFixed(2),
    });
  }

  promptIsDefault(): boolean {
    const v = this.view();
    return !!v && this.form.controls.system_prompt.value.trim() === v.default_system_prompt.trim();
  }

  restoreDefaultPrompt(): void {
    const v = this.view();
    if (!v) return;
    this.form.controls.system_prompt.setValue(v.default_system_prompt);
    this.form.controls.system_prompt.markAsDirty();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const update: AIReportSettingsUpdate = {
      ...value,
      // the default prompt is stored as empty, so later improvements to it apply
      system_prompt: this.promptIsDefault() ? '' : value.system_prompt,
    };
    this.saving.set(true);
    this.aiService.updateSettings(update).subscribe({
      next: (view) => {
        this.apply(view);
        this.saving.set(false);
        this.errorService.handle(this.translate.instant('aiAnalysis.settings.saved'));
      },
      error: (err) => {
        this.saving.set(false);
        this.errorService.handle(explainRequestError(err, 'aiAnalysis.errors.saveSettings', this.translate));
      },
    });
  }

  test(): void {
    this.testing.set(true);
    this.testResult.set(null);
    this.aiService.test().subscribe({
      next: (usage) => {
        this.testing.set(false);
        this.testResult.set(usage);
        // refresh the month's spend, keeping unsaved edits
        this.load(true);
      },
      error: (err) => {
        this.testing.set(false);
        this.errorService.handle(explainRequestError(err, 'aiAnalysis.errors.test', this.translate));
      },
    });
  }
}
