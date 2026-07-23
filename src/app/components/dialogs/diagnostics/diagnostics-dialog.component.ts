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

export interface DiagnosticsDialogData {
  chargePointId: string;
  // The upload URL to pre-fill, typically the last one used. GetDiagnostics
  // tells the charge point to push its log file here, so it must be a location
  // the charge point itself can reach - not the operator's browser.
  defaultLocation?: string;
}

// GetDiagnostics requires a URI. The charge point uploads over whatever scheme
// the URL names, usually ftp; http(s) is accepted so this does not reject a
// setup that uses it.
const LOCATION_PATTERN = /^(ftp|ftps|http|https):\/\/.+/i;

@Component({
  selector: 'app-diagnostics-dialog',
  templateUrl: './diagnostics-dialog.component.html',
  styleUrls: ['./diagnostics-dialog.component.css'],
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
export class DiagnosticsDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DiagnosticsDialogComponent>);
  readonly data = inject<DiagnosticsDialogData>(MAT_DIALOG_DATA);

  readonly location = new FormControl(this.data.defaultLocation ?? '', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(LOCATION_PATTERN)]
  });

  send(): void {
    if (this.location.invalid) {
      this.location.markAsTouched();
      return;
    }
    this.dialogRef.close(this.location.value.trim());
  }
}
