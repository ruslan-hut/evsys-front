import {Component, Inject, OnInit, Optional} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs';

import {UserTagService} from '../../../service/user-tag.service';
import {ErrorService} from '../../../service/error.service';
import {UserTag} from '../../../models/user-tag';

import {MatCard, MatCardActions, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatSlideToggle} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-user-tag-edit',
  templateUrl: './user-tag-edit.component.html',
  styleUrls: ['./user-tag-edit.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardFooter,
    MatFormField, MatLabel, MatError, MatHint,
    MatInput,
    MatButton,
    MatProgressBar,
    MatSlideToggle
  ]
})
export class UserTagEditComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  idTag: string | null = null;
  tag: UserTag | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userTagService: UserTagService,
    private errorService: ErrorService,
    @Optional() public dialogRef?: MatDialogRef<UserTagEditComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { idTag: string }
  ) {}

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
      },
      error: () => {
        this.errorService.handle('Failed to load tag data');
        this.loading = false;
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
        this.navigateBack();
      },
      error: (error) => {
        this.saving = false;
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
      this.router.navigate(['/user-tags']);
    }
  }

  cancel(): void {
    this.navigateBack();
  }
}
