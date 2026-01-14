import {Component, Inject, OnInit, Optional, ChangeDetectionStrategy, ChangeDetectorRef, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Location} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs';

import {UserTagService} from '../../../service/user-tag.service';
import {ErrorService} from '../../../service/error.service';
import {UserTag} from '../../../models/user-tag';

import {MatCard, MatCardActions, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatIcon} from '@angular/material/icon';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-user-tag-edit',
  templateUrl: './user-tag-edit.component.html',
  styleUrls: ['./user-tag-edit.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardFooter,
    MatFormField, MatLabel, MatError,
    MatInput,
    MatButton, MatIconButton,
    MatProgressBar,
    MatSlideToggle,
    MatIcon
  ]
})
export class UserTagEditComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly userTagService = inject(UserTagService);
  private readonly errorService = inject(ErrorService);
  private readonly clipboard = inject(Clipboard);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly dialogRef = inject(MatDialogRef<UserTagEditComponent>, { optional: true });
  readonly dialogData = inject<{ idTag: string }>(MAT_DIALOG_DATA, { optional: true });

  form!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  idTag: string | null = null;
  tag: UserTag | null = null;

  ngOnInit(): void {
    this.initForm();

    this.idTag = this.dialogData?.idTag || this.route.snapshot.paramMap.get('idTag');

    if (this.idTag) {
      this.isEditMode = true;
      this.loadTagData();
    }
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      id_tag: ['', [Validators.required, Validators.minLength(1)]],
      username: ['', [Validators.required, Validators.minLength(1)]],
      source: [''],
      is_enabled: [true],
      local: [false],
      note: ['']
    });
  }

  private loadTagData(): void {
    if (!this.idTag) return;

    this.loading = true;
    this.userTagService.getByIdTag(this.idTag).subscribe({
      next: (tag) => {
        this.tag = tag;
        this.patchForm(tag);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorService.handle('Failed to load tag data');
        this.loading = false;
        this.cdr.markForCheck();
        this.navigateBack();
      }
    });
  }

  private patchForm(tag: UserTag): void {
    this.form.patchValue({
      id_tag: tag.id_tag,
      username: tag.username || '',
      source: tag.source || '',
      is_enabled: tag.is_enabled ?? true,
      local: tag.local ?? false,
      note: tag.note || ''
    });

    this.form.get('id_tag')?.disable();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorService.handle('Please correct the form errors');
      return;
    }

    this.saving = true;
    const formData = this.form.getRawValue();

    const request$ = this.isEditMode
      ? this.userTagService.update(this.idTag!, formData)
      : this.userTagService.create(formData);

    request$.pipe(first()).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.markForCheck();
        this.navigateBack();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.markForCheck();
        const message = error.status === 400
          ? 'Tag ID already exists or invalid data'
          : 'Failed to save tag';
        this.errorService.handle(message);
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

  copyIdTag(): void {
    if (this.idTag) {
      this.clipboard.copy(this.idTag);
    }
  }
}
