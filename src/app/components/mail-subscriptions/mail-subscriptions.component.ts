import {ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelDescription, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {MatDialog} from '@angular/material/dialog';
import {BasicDialogComponent} from '../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../models/dialog-data';
import {MailLanguage, MailRecipient, MailReportType, MailSubscription, MailSubscriptionPeriod, ReportLocation} from '../../models/mail-subscription';
import {MailSubscriptionService} from '../../service/mail-subscription.service';
import {StatsService} from '../../service/stats.service';
import {ErrorService} from '../../service/error.service';
import {Group} from '../../models/group';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {RowAction, RowActionsComponent} from '../ui/row-actions/row-actions.component';

/**
 * Mail reports, one entry per address: an admin looks for a person and sees
 * everything they receive, rather than scanning a flat list of subscriptions.
 */
@Component({
  selector: 'app-mail-subscriptions',
  templateUrl: './mail-subscriptions.component.html',
  styleUrls: ['./mail-subscriptions.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RowActionsComponent,
    ReactiveFormsModule,
    FormsModule,
    MatProgressBar,
    MatFormField, MatLabel, MatHint, MatInput, MatSelect, MatOption,
    MatSlideToggle, MatButton, MatIcon,
    MatCard, MatCardContent, MatCardHeader, MatCardTitle,
    MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription,
    TranslatePipe,
  ],
})
export class MailSubscriptionsComponent implements OnInit {
  private readonly mailService = inject(MailSubscriptionService);
  private readonly statsService = inject(StatsService);
  private readonly errorService = inject(ErrorService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  readonly periods: MailSubscriptionPeriod[] = ['daily', 'weekly', 'monthly'];
  readonly reportTypes: MailReportType[] = ['statistic', 'ai_analysis'];
  readonly languages: MailLanguage[] = ['es', 'en'];
  readonly groups: Group[] = this.statsService.getGroups();

  readonly locations = signal<ReportLocation[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly subscriptions = signal<MailSubscription[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly reportType = signal<MailReportType>('statistic');
  /** Addresses whose panels are open, lower case; kept across reloads. */
  readonly openPanels = signal<ReadonlySet<string>>(new Set());

  testEmail = '';
  readonly testing = signal(false);

  readonly recipients = computed<MailRecipient[]>(() => {
    const byEmail = new Map<string, MailRecipient>();
    for (const sub of this.subscriptions()) {
      const key = sub.email.trim().toLowerCase();
      let recipient = byEmail.get(key);
      if (!recipient) {
        recipient = {email: sub.email.trim(), subscriptions: [], enabled: 0};
        byEmail.set(key, recipient);
      }
      recipient.subscriptions.push(sub);
      if (sub.enabled) recipient.enabled++;
    }
    const list = [...byEmail.values()];
    for (const r of list) {
      // the AI analysis first, then statistic reports by period
      r.subscriptions.sort((a, b) => this.order(a) - this.order(b));
    }
    return list.sort((a, b) => a.email.localeCompare(b.email));
  });

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    report: ['statistic' as MailReportType, Validators.required],
    period: ['daily' as MailSubscriptionPeriod | '', Validators.required],
    user_group: [this.groups[0]?.id ?? 'default', Validators.required],
    language: ['es' as MailLanguage, Validators.required],
    /** Empty: the whole network. */
    location_ids: [[] as string[]],
    enabled: [true],
  });

  ngOnInit(): void {
    // period and group only make sense for statistic reports
    this.form.controls.report.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(type => this.applyReportType(type));
    this.load();
    this.mailService.locations().subscribe({
      next: (list) => this.locations.set(list ?? []),
      error: () => this.locations.set([]),
    });
  }

  private applyReportType(type: MailReportType): void {
    this.reportType.set(type);
    const {period, user_group} = this.form.controls;
    if (type === 'ai_analysis') {
      period.disable({emitEvent: false});
      user_group.disable({emitEvent: false});
    } else {
      period.enable({emitEvent: false});
      user_group.enable({emitEvent: false});
      if (!period.value) period.setValue('daily', {emitEvent: false});
    }
  }

  private order(sub: MailSubscription): number {
    if (sub.report === 'ai_analysis') return 0;
    return 1 + this.periods.indexOf(sub.period as MailSubscriptionPeriod);
  }

  load(): void {
    this.loading.set(true);
    this.mailService.list().subscribe({
      next: (subs) => {
        this.subscriptions.set(subs ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadMailSubs'));
        this.loading.set(false);
      },
    });
  }

  private resetForm(values: Partial<MailSubscription> = {}): void {
    const report = values.report ?? 'statistic';
    this.form.reset({
      email: values.email ?? '',
      report,
      period: values.period || 'daily',
      user_group: values.user_group || (this.groups[0]?.id ?? 'default'),
      language: values.language ?? 'es',
      location_ids: values.location_ids ?? [],
      enabled: values.enabled ?? true,
    });
    this.applyReportType(report);
  }

  /** The form sits at the top of the page, above the addresses. */
  private showForm(): void {
    window.scrollTo({top: 0, behavior: 'smooth'});
    document.querySelector<HTMLInputElement>('.mail-subs-form input[formcontrolname="email"]')?.focus({preventScroll: true});
  }

  private keepOpen(email: string): void {
    const key = email.trim().toLowerCase();
    this.openPanels.update(open => new Set(open).add(key));
  }

  panelToggled(recipient: MailRecipient, open: boolean): void {
    const key = recipient.email.toLowerCase();
    this.openPanels.update(current => {
      const next = new Set(current);
      if (open) next.add(key); else next.delete(key);
      return next;
    });
  }

  /** Starts a new report for an address that already receives some. */
  addReportTo(recipient: MailRecipient): void {
    this.editingId.set(null);
    const hasAI = recipient.subscriptions.some(s => s.report === 'ai_analysis');
    this.resetForm({email: recipient.email, report: hasAI ? 'statistic' : 'ai_analysis'});
    this.showForm();
  }

  actionsFor(sub: MailSubscription): RowAction[] {
    return [
      {labelKey: 'actions.edit', icon: 'edit', run: () => this.startEdit(sub)},
      {labelKey: 'actions.sendNow', icon: 'send', disabled: !sub.enabled, run: () => this.sendNow(sub)},
      {labelKey: 'actions.delete', icon: 'delete', warn: true, run: () => this.delete(sub)},
    ];
  }

  startEdit(sub: MailSubscription): void {
    this.editingId.set(sub.id ?? null);
    this.resetForm(sub);
    this.showForm();
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  save(formDir: FormGroupDirective): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const ai = value.report === 'ai_analysis';
    const payload: MailSubscription = {
      email: value.email.trim(),
      report: value.report,
      period: ai ? '' : value.period,
      user_group: ai ? '' : value.user_group,
      language: value.language,
      // an empty list is sent, not left out: it returns to the whole network
      location_ids: ai ? value.location_ids : [],
      enabled: value.enabled,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.mailService.update(id, payload) : this.mailService.create(payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.keepOpen(payload.email);
        // clears the submitted state too, so the empty form shows no errors
        formDir.resetForm();
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.saveMailSub'));
        this.saving.set(false);
      },
    });
  }

  /**
   * Switches one report on or off in place. The list changes at once and
   * changes back on failure, so the toggle, bound one way, follows both.
   */
  toggle(sub: MailSubscription, enabled: boolean): void {
    if (!sub.id) return;
    const setEnabled = (value: boolean) =>
      this.subscriptions.update(list => list.map(s => s.id === sub.id ? {...s, enabled: value} : s));
    setEnabled(enabled);
    const {email, report, period, user_group, language, location_ids} = sub;
    this.mailService.update(sub.id, {email, report, period, user_group, language, location_ids: location_ids ?? [], enabled}).subscribe({
      error: () => {
        setEnabled(!enabled);
        this.errorService.handle(this.translate.instant('errors.saveMailSub'));
      },
    });
  }

  delete(sub: MailSubscription): void {
    if (!sub.id) return;
    const data: DialogData = {
      title: this.translate.instant('mailSubscriptions.deleteTitle'),
      content: this.translate.instant('mailSubscriptions.deleteContent', {email: sub.email, report: this.describe(sub)}),
      buttonYes: this.translate.instant('mailSubscriptions.deleteYes'),
      buttonNo: this.translate.instant('mailSubscriptions.deleteNo'),
      checkboxes: [],
    };
    const ref = this.dialog.open(BasicDialogComponent, {width: '320px', data});
    ref.afterClosed().subscribe((result) => {
      if (result !== 'yes') return;
      this.keepOpen(sub.email);
      this.mailService.delete(sub.id!).subscribe({
        next: () => this.load(),
        error: () => this.errorService.handle(this.translate.instant('errors.deleteSub')),
      });
    });
  }

  sendTest(): void {
    const email = this.testEmail.trim();
    if (!email) return;
    this.testing.set(true);
    this.mailService.sendTest(email).subscribe({
      next: () => {
        this.testing.set(false);
        this.errorService.handle(this.translate.instant('mailSubscriptions.testSent', {email}));
      },
      error: () => {
        this.testing.set(false);
        this.errorService.handle(this.translate.instant('errors.sendTestMail'));
      },
    });
  }

  sendNow(sub: MailSubscription): void {
    if (!sub.id) return;
    const sentKey = sub.report === 'ai_analysis' ? 'mailSubscriptions.aiReportQueued' : 'mailSubscriptions.reportSent';
    this.mailService.sendNow(sub.id).subscribe({
      next: () => this.errorService.handle(this.translate.instant(sentKey)),
      error: () => this.errorService.handle(this.translate.instant('errors.sendReport')),
    });
  }

  isExpanded(recipient: MailRecipient): boolean {
    return this.openPanels().has(recipient.email.toLowerCase());
  }

  groupName(id: string): string {
    return this.groups.find((g) => g.id === id)?.name ?? id;
  }

  /** One line naming a report, e.g. "AI analysis · ES" or "Consumption · Weekly · Client". */
  describe(sub: MailSubscription): string {
    if (sub.report === 'ai_analysis') {
      return [
        this.translate.instant('mailSubscriptions.reportTypes.ai_analysis'),
        sub.language.toUpperCase(),
        this.locationNames(sub),
      ].join(' · ');
    }
    return [
      this.translate.instant('mailSubscriptions.reportTypes.statistic'),
      this.translate.instant('mailSubscriptions.periods.' + sub.period),
      this.translate.instant(this.groupName(sub.user_group)),
    ].join(' · ');
  }

  /** The locations an AI analysis covers: their names, or the whole network. */
  locationNames(sub: MailSubscription): string {
    const ids = sub.location_ids ?? [];
    if (ids.length === 0) return this.translate.instant('mailSubscriptions.allLocations');
    return ids.map(id => this.locations().find(l => l.id === id)?.name ?? id).join(', ');
  }

  summary(recipient: MailRecipient): string {
    return this.translate.instant('mailSubscriptions.summary', {
      total: recipient.subscriptions.length,
      enabled: recipient.enabled,
    });
  }
}
