import {Component, ChangeDetectionStrategy, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import {DialogData} from "../../../models/dialog-data";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CdkScrollable } from '@angular/cdk/scrolling';

import { MatCheckbox } from '@angular/material/checkbox';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-basic-dialog',
    templateUrl: './basic-dialog.component.html',
    styleUrls: ['./basic-dialog.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    MatCheckbox,
    MatDialogActions,
    MatButton
],
})
export class BasicDialogComponent {
  readonly dialogRef = inject(MatDialogRef<BasicDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);

  checked: boolean[];
  isConfirm: boolean;

  constructor() {
    this.checked = new Array<boolean>(this.data.checkboxes.length);
    this.checked.fill(false);
    this.isConfirm = this.data.checkboxes.length == 0;
  }

  getContent(): SafeHtml {
    if (this.data.content !== "") {
      return this.sanitizer.bypassSecurityTrustHtml(this.data.content);
    }
    return "Are you sure?";
  }

  onChecked(i: number){
    this.checked[i] = !this.checked[i];
    this.isConfirm = this.checked.every((value) => value);
  }
}
