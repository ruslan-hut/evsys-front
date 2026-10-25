import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatDialog} from '@angular/material/dialog';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AIReportService} from '../../../service/ai-report.service';
import {ErrorService} from '../../../service/error.service';
import {serverMessage} from '../../../helpers/error.interceptor';
import {BasicDialogComponent} from '../../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../../models/dialog-data';
import {AIReport, AIReportLanguage, AIReportRunRequest} from '../../../models/ai-report';

/** How often the list is refreshed while a run is in progress. */
const POLL_MS = 3000;
/**
 * A run lasts at most 30 minutes on the backend; one "running" for longer was
 * cut short by a restart and is closed on the next start, so it must not hold
 * the page in its waiting state.
 */
const STALE_RUN_MS = 35 * 60 * 1000;

/** Formats a moment as a day in the report's time zone, not the browser's. */
export function dayIn(value: string | Date, timeZone: string, withYear: boolean): string {
  const options: Intl.DateTimeFormatOptions = {day: '2-digit', month: '2-digit', timeZone};
  if (withYear) options.year = 'numeric';
  try {
    return new Intl.DateTimeFormat('es-ES', options).format(new Date(value)).replace(/\//g, '.');
  } catch {
    return new Intl.DateTimeFormat('es-ES', {...options, timeZone: 'UTC'}).format(new Date(value)).replace(/\//g, '.');
  }
}

@Component({
  selector: 'app-ai-reports',
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, DecimalPipe,
    MatProgressBar, MatButton, MatIcon, MatFormField, MatLabel, MatSelect, MatOption,
    MatCard, MatCardContent, MatButtonToggleGroup, MatButtonToggle,
    MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
    TranslatePipe,
  ],
})
export class AIReportsComponent implements OnInit {
  private readonly aiService = inject(AIReportService);
  private readonly errorService = inject(ErrorService);
  private readonly translate = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = inject(MatDialog);

  readonly languages: AIReportLanguage[] = ['es', 'en'];

  readonly loading = signal(false);
  readonly starting = signal(false);
  readonly reports = signal<AIReport[]>([]);
  readonly selected = signal<AIReport | null>(null);
  readonly previewLanguage = signal<AIReportLanguage>('es');
  readonly previewSubject = signal('');
  readonly previewHtml = signal<SafeHtml | null>(null);
  readonly previewLoading = signal(false);
  readonly runLanguage = signal<AIReportLanguage>('es');

  readonly anyRunning = computed(() => {
    const now = Date.now();
    return this.reports().some(r => r.status === 'running' && now - new Date(r.created_at).getTime() < STALE_RUN_MS);
  });
  readonly selectedLanguages = computed(() =>
    (this.selected()?.analyses ?? []).filter(a => !!a.result).map(a => a.language));
  readonly prettySnapshot = computed(() => {
    const raw = this.selected()?.snapshot;
    if (!raw) return '';
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  });

  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  /** The report most recently asked for. */
  private opening: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopPolling());
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.aiService.reports().subscribe({
      next: (list) => {
        this.reports.set(list ?? []);
        this.loading.set(false);
        this.refreshSelected();
        this.schedulePoll();
      },
      error: () => {
        this.loading.set(false);
        this.errorService.handle(this.translate.instant('aiAnalysis.errors.loadReports'));
        // a refresh that failed during a run must not stop following it
        this.schedulePoll();
      },
    });
  }

  private schedulePoll(): void {
    this.stopPolling();
    if (this.anyRunning()) {
      this.pollTimer = setTimeout(() => this.load(), POLL_MS);
    }
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Reloads the open report when the list shows it changed. */
  private refreshSelected(): void {
    const open = this.selected();
    if (!open) return;
    const row = this.reports().find(r => r.id === open.id);
    if (row && (row.status !== open.status || (row.deliveries?.length ?? 0) !== (open.deliveries?.length ?? 0))) {
      this.open(row);
    }
  }

  open(row: AIReport): void {
    this.opening = row.id;
    this.aiService.report(row.id).subscribe({
      next: (report) => {
        // a slower answer for a row clicked earlier must not replace this one
        if (this.opening !== report.id) return;
        this.selected.set(report);
        const langs = this.selectedLanguages();
        const lang = langs.includes(this.previewLanguage()) ? this.previewLanguage() : langs[0];
        if (lang) {
          this.showPreview(lang);
        } else {
          this.previewHtml.set(null);
          this.previewSubject.set('');
        }
      },
      error: () => this.errorService.handle(this.translate.instant('aiAnalysis.errors.loadReport')),
    });
  }

  onRowKey(event: Event, row: AIReport): void {
    event.preventDefault();
    this.open(row);
  }

  close(): void {
    this.opening = null;
    this.selected.set(null);
    this.previewHtml.set(null);
  }

  showPreview(language: AIReportLanguage): void {
    const report = this.selected();
    if (!report) return;
    this.previewLanguage.set(language);
    this.previewLoading.set(true);
    this.previewHtml.set(null);
    this.previewSubject.set('');
    this.aiService.preview(report.id, language).subscribe({
      next: (preview) => {
        // the user may have switched report or language meanwhile
        if (this.selected()?.id !== report.id || this.previewLanguage() !== language) return;
        this.previewSubject.set(preview.subject);
        // the email is built by the backend with every model text escaped, and
        // the frame is sandboxed without scripts
        this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(preview.html));
        this.previewLoading.set(false);
      },
      error: () => {
        this.previewLoading.set(false);
        this.errorService.handle(this.translate.instant('aiAnalysis.errors.preview'));
      },
    });
  }

  dryRun(): void {
    this.start({dry_run: true});
  }

  generate(): void {
    this.start({language: this.runLanguage()});
  }

  /** Sending reaches every subscriber and costs a request per language: confirm first. */
  generateAndSend(): void {
    const data: DialogData = {
      title: this.translate.instant('aiAnalysis.reports.sendAllTitle'),
      content: this.translate.instant('aiAnalysis.reports.sendAllContent'),
      buttonYes: this.translate.instant('aiAnalysis.reports.sendAllYes'),
      buttonNo: this.translate.instant('common.cancel'),
      checkboxes: [],
    };
    this.dialog.open(BasicDialogComponent, {width: '360px', data}).afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.start({send_all: true});
      }
    });
  }

  private start(request: AIReportRunRequest): void {
    this.starting.set(true);
    this.aiService.run(request).subscribe({
      next: (report) => {
        this.starting.set(false);
        this.reports.update(list => [report, ...list.filter(r => r.id !== report.id)]);
        this.opening = report.id;
        this.selected.set(report);
        this.previewHtml.set(null);
        this.schedulePoll();
      },
      error: (err) => {
        this.starting.set(false);
        this.errorService.handle(this.translate.instant('aiAnalysis.errors.run', {error: serverMessage(err)}));
      },
    });
  }

  languagesOf(report: AIReport): string {
    return (report.analyses ?? []).filter(a => !!a.result).map(a => a.language.toUpperCase()).join(', ');
  }

  analysisStatus(report: AIReport): string {
    const analysis = (report.analyses ?? []).find(a => !!a.result);
    return analysis?.result?.status ?? '';
  }

  failedDeliveries(report: AIReport): number {
    return (report.deliveries ?? []).filter(d => !!d.error).length;
  }

  /** "18.10 – 24.10.2026": the stored end is the exclusive midnight after the last day. */
  periodLabel(report: AIReport, withYear = false): string {
    const last = new Date(new Date(report.period_to).getTime() - 1000);
    return `${dayIn(report.period_from, report.time_zone, withYear)} – ${dayIn(last, report.time_zone, true)}`;
  }
}
