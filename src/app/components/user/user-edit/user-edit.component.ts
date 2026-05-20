import {Component, Inject, OnInit, Optional, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs';

import {AccountService} from '../../../service/account.service';
import {ErrorService} from '../../../service/error.service';
import {User} from '../../../models/user';

import {MatCard, MatCardActions, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatIcon} from '@angular/material/icon';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {Clipboard} from '@angular/cdk/clipboard';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardFooter,
    MatFormField, MatLabel, MatError, MatHint,
    MatInput,
    MatSelect, MatOption,
    MatButton, MatIconButton,
    MatProgressBar,
    MatIcon,
    MatSlideToggle,
    TranslatePipe
  ]
})
export class UserEditComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly accountService = inject(AccountService);
  private readonly errorService = inject(ErrorService);
  private readonly clipboard = inject(Clipboard);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);
  readonly dialogRef = inject(MatDialogRef<UserEditComponent>, { optional: true });
  readonly dialogData = inject<{ username: string }>(MAT_DIALOG_DATA, { optional: true });

  form!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  username: string | null = null;
  user: User | null = null;

  roles = [
    {value: '', label: 'userEdit.roles.user'},
    {value: 'operator', label: 'userEdit.roles.operator'},
    {value: 'admin', label: 'userEdit.roles.admin'}
  ];

  ngOnInit(): void {
    this.initForm();

    this.username = this.dialogData?.username || this.route.snapshot.paramMap.get('username');

    if (this.username) {
      this.isEditMode = true;
      this.loadUserData();
    }
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]],
      name: [''],
      email: ['', [Validators.email]],
      role: [''],
      access_level: [0, [Validators.min(0), Validators.max(10)]],
      payment_plan: [''],
      warning_emails_enabled: [false],
      warning_email: ['', [Validators.email]]
    });
  }

  private loadUserData(): void {
    if (!this.username) return;

    this.loading = true;
    this.accountService.getUserInfo(this.username).subscribe({
      next: (user) => {
        this.user = user;
        this.patchForm(user);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle(this.translate.instant('errors.loadUserData'));
        this.loading = false;
        this.cdr.markForCheck();
        this.navigateBack();
      }
    });
  }

  private patchForm(user: User): void {
    this.form.patchValue({
      username: user.username,
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      access_level: user.access_level || 0,
      payment_plan: user.payment_plan || '',
      warning_emails_enabled: user.warning_emails_enabled || false,
      warning_email: user.warning_email || ''
    });

    this.form.get('username')?.disable();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorService.handle(this.translate.instant('errors.correctFormErrors'));
      return;
    }

    if (!this.isEditMode && !this.form.get('password')?.value) {
      this.errorService.handle(this.translate.instant('errors.passwordRequired'));
      return;
    }

    this.saving = true;
    const formData = this.form.getRawValue();

    if (!formData.password) {
      delete formData.password;
    }

    const request$ = this.isEditMode
      ? this.accountService.updateUser(this.username!, formData)
      : this.accountService.createUser(formData);

    request$.pipe(first()).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.markForCheck();
        this.navigateBack();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.markForCheck();
        const key = error.status === 400 ? 'userEdit.usernameExists' : 'errors.saveUser';
        this.errorService.handle(this.translate.instant(key));
      }
    });
  }

  navigateBack(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
    } else {
      this.location.back();
    }
  }

  cancel(): void {
    this.navigateBack();
  }

  openUserTags(): void {
    this.router.navigate(['/user-tags'], {queryParams: {username: this.username}});
  }

  copyUsername(): void {
    if (this.username) {
      this.clipboard.copy(this.username);
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const parts = dateStr.split(' ');
    const datePart = (parts.length >= 2 ? parts[0] : dateStr.split('T')[0]);
    const ymd = datePart.split('-');
    if (ymd.length === 3) {
      const time = parts.length >= 2 ? ` ${parts[1]}` : '';
      return `${ymd[2]}-${ymd[1]}-${ymd[0]}${time}`;
    }
    return dateStr;
  }
}
