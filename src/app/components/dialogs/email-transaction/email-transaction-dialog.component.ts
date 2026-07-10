import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions
} from '@angular/material/dialog';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {CdkScrollable} from '@angular/cdk/scrolling';
import {TranslatePipe} from '@ngx-translate/core';

export interface EmailTransactionDialogData {
  transactionId: number;
  defaultEmail?: string;
}

// Mirrors the backend `email_rfc` validator, so an address accepted here is not
// rejected server-side with a generic failure.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-email-transaction-dialog',
  templateUrl: './email-transaction-dialog.component.html',
  styleUrls: ['./email-transaction-dialog.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    TranslatePipe
  ]
})
export class EmailTransactionDialogComponent {
  readonly dialogRef = inject(MatDialogRef<EmailTransactionDialogComponent>);
  readonly data = inject<EmailTransactionDialogData>(MAT_DIALOG_DATA);

  readonly email = new FormControl(this.data.defaultEmail ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_PATTERN)]
  });

  send(): void {
    if (this.email.invalid) {
      this.email.markAsTouched();
      return;
    }
    this.dialogRef.close(this.email.value.trim());
  }
}
