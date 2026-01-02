import {Component, Inject, OnInit, Optional} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs';

import {AccountService} from '../../../service/account.service';
import {ErrorService} from '../../../service/error.service';
import {User} from '../../../models/user';

import {MatCard, MatCardActions, MatCardContent, MatCardFooter, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton} from '@angular/material/button';
import {MatProgressBar} from '@angular/material/progress-bar';

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatCardFooter,
    MatFormField, MatLabel, MatError, MatHint,
    MatInput,
    MatSelect, MatOption,
    MatButton,
    MatProgressBar
  ]
})
export class UserEditComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  isEditMode = false;
  username: string | null = null;
  user: User | null = null;

  roles = [
    {value: '', label: 'User'},
    {value: 'operator', label: 'Operator'},
    {value: 'admin', label: 'Administrator'}
  ];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private errorService: ErrorService,
    @Optional() public dialogRef?: MatDialogRef<UserEditComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData?: { username: string }
  ) {}

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
      payment_plan: ['']
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
      },
      error: () => {
        this.errorService.handle('Failed to load user data');
        this.loading = false;
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
      payment_plan: user.payment_plan || ''
    });

    this.form.get('username')?.disable();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorService.handle('Please correct the form errors');
      return;
    }

    if (!this.isEditMode && !this.form.get('password')?.value) {
      this.errorService.handle('Password is required for new users');
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
        this.navigateBack();
      },
      error: (error) => {
        this.saving = false;
        const message = error.status === 400
          ? 'Username already exists or invalid data'
          : 'Failed to save user';
        this.errorService.handle(message);
      }
    });
  }

  navigateBack(): void {
    if (this.dialogRef) {
      this.dialogRef.close(true);
    } else {
      this.router.navigate(['/users']);
    }
  }

  cancel(): void {
    this.navigateBack();
  }
}
