import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow} from '@angular/material/table';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatLabel, MatHint} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {forkJoin, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {BasicDialogComponent} from '../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../models/dialog-data';
import {WebhookSubscriber} from '../../models/webhook-subscriber';
import {WebhookDelivery, WebhookHealth} from '../../models/webhook-health';
import {WebhookService} from '../../service/webhook.service';
import {ErrorService} from '../../service/error.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-webhooks',
  templateUrl: './webhooks.component.html',
  styleUrls: ['./webhooks.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatProgressBar,
    MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
    MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow,
    MatFormField, MatLabel, MatHint, MatInput,
    MatSlideToggle, MatButton, MatIconButton, MatIcon,
    MatCard, MatCardContent, MatCardHeader, MatCardTitle,
    TranslatePipe,
  ],
})
export class WebhooksComponent implements OnInit {
  private readonly webhookService = inject(WebhookService);
  private readonly errorService = inject(ErrorService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  readonly healthColumns = ['name', 'enabled', 'pending', 'failed', 'delivered', 'oldestPending', 'lastDelivered'];
  readonly subscriberColumns = ['name', 'url', 'events', 'enabled', 'actions'];
  readonly failureColumns = ['created', 'subscriber', 'type', 'status', 'attempts', 'nextAttempt', 'error'];

  loading = false;
  saving = false;
  subscribers: WebhookSubscriber[] = [];
  health: WebhookHealth[] = [];
  failures: WebhookDelivery[] = [];
  editingId: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    token: [''],
    events: ['', Validators.required],
    is_enabled: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    // health and failures are diagnostic; their failure must not blank the subscriber list
    forkJoin({
      subscribers: this.webhookService.list(),
      health: this.webhookService.health().pipe(catchError(() => of([] as WebhookHealth[]))),
      failures: this.webhookService.failures().pipe(catchError(() => of([] as WebhookDelivery[]))),
    }).subscribe({
      next: ({subscribers, health, failures}) => {
        this.subscribers = subscribers ?? [];
        this.health = health ?? [];
        this.failures = failures ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadWebhooks'));
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  startEdit(sub: WebhookSubscriber): void {
    this.editingId = sub.id ?? null;
    this.form.reset({
      name: sub.name,
      url: sub.url,
      token: sub.token,
      events: sub.events.join(', '),
      is_enabled: sub.is_enabled,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({name: '', url: '', token: '', events: '', is_enabled: true});
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: WebhookSubscriber = {
      name: raw.name.trim(),
      url: raw.url.trim(),
      token: raw.token?.trim() ?? '',
      events: raw.events.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0),
      is_enabled: raw.is_enabled,
    };
    if (payload.events.length === 0) {
      this.form.get('events')?.setErrors({required: true});
      return;
    }
    this.saving = true;
    const obs = this.editingId
      ? this.webhookService.update(this.editingId, payload)
      : this.webhookService.create(payload);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.saveWebhook'));
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  delete(sub: WebhookSubscriber): void {
    if (!sub.id) return;
    const data: DialogData = {
      title: this.translate.instant('webhooks.deleteTitle'),
      content: this.translate.instant('webhooks.deleteContent', {name: sub.name}),
      buttonYes: this.translate.instant('webhooks.deleteYes'),
      buttonNo: this.translate.instant('webhooks.deleteNo'),
      checkboxes: [],
    };
    const ref = this.dialog.open(BasicDialogComponent, {width: '320px', data});
    ref.afterClosed().subscribe((result) => {
      if (result !== 'yes') return;
      this.webhookService.delete(sub.id!).subscribe({
        next: () => this.load(),
        error: () => this.errorService.handle(this.translate.instant('errors.deleteWebhook')),
      });
    });
  }

  eventsLabel(sub: WebhookSubscriber): string {
    return sub.events.join(', ');
  }
}
