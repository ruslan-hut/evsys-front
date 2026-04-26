import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow} from '@angular/material/table';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {BasicDialogComponent} from '../dialogs/basic/basic-dialog.component';
import {DialogData} from '../../models/dialog-data';
import {MailSubscription, MailSubscriptionPeriod} from '../../models/mail-subscription';
import {MailSubscriptionService} from '../../service/mail-subscription.service';
import {StatsService} from '../../service/stats.service';
import {ErrorService} from '../../service/error.service';
import {Group} from '../../models/group';

@Component({
  selector: 'app-mail-subscriptions',
  templateUrl: './mail-subscriptions.component.html',
  styleUrls: ['./mail-subscriptions.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatProgressBar,
    MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
    MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow, MatNoDataRow,
    MatFormField, MatLabel, MatInput, MatSelect, MatOption,
    MatSlideToggle, MatButton, MatIconButton, MatIcon,
    MatCard, MatCardContent, MatCardHeader, MatCardTitle,
  ],
})
export class MailSubscriptionsComponent implements OnInit {
  private readonly mailService = inject(MailSubscriptionService);
  private readonly statsService = inject(StatsService);
  private readonly errorService = inject(ErrorService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly periods: MailSubscriptionPeriod[] = ['daily', 'weekly', 'monthly'];
  readonly groups: Group[] = this.statsService.getGroups();
  readonly displayedColumns = ['email', 'period', 'group', 'enabled', 'actions'];

  loading = false;
  saving = false;
  subscriptions: MailSubscription[] = [];
  editingId: string | null = null;

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    period: ['daily' as MailSubscriptionPeriod, Validators.required],
    user_group: [this.groups[0]?.id ?? 'default', Validators.required],
    enabled: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.mailService.list().subscribe({
      next: (subs) => {
        this.subscriptions = subs ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle('Failed to load mail subscriptions');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  startCreate(): void {
    this.editingId = null;
    this.form.reset({
      email: '',
      period: 'daily',
      user_group: this.groups[0]?.id ?? 'default',
      enabled: true,
    });
  }

  startEdit(sub: MailSubscription): void {
    this.editingId = sub.id ?? null;
    this.form.reset({
      email: sub.email,
      period: sub.period,
      user_group: sub.user_group,
      enabled: sub.enabled,
    });
  }

  cancelEdit(): void {
    this.editingId = null;
    this.form.reset({
      email: '',
      period: 'daily',
      user_group: this.groups[0]?.id ?? 'default',
      enabled: true,
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: MailSubscription = this.form.getRawValue();
    this.saving = true;
    const obs = this.editingId
      ? this.mailService.update(this.editingId, payload)
      : this.mailService.create(payload);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.errorService.handle('Failed to save mail subscription');
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }

  delete(sub: MailSubscription): void {
    if (!sub.id) return;
    const data: DialogData = {
      title: 'Delete subscription',
      content: `Delete report subscription for "${sub.email}"?`,
      buttonYes: 'Delete',
      buttonNo: 'Cancel',
      checkboxes: [],
    };
    const ref = this.dialog.open(BasicDialogComponent, {width: '320px', data});
    ref.afterClosed().subscribe((result) => {
      if (result !== 'yes') return;
      this.mailService.delete(sub.id!).subscribe({
        next: () => this.load(),
        error: () => this.errorService.handle('Failed to delete subscription'),
      });
    });
  }

  sendNow(sub: MailSubscription): void {
    if (!sub.id) return;
    this.mailService.sendNow(sub.id).subscribe({
      next: () => this.errorService.handle('Report sent'),
      error: () => this.errorService.handle('Failed to send report'),
    });
  }

  groupName(id: string): string {
    return this.groups.find((g) => g.id === id)?.name ?? id;
  }
}
