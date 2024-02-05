import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from "../../../models/dialog-data";
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-basic-dialog',
  templateUrl: './basic-dialog.component.html',
  styleUrls: ['./basic-dialog.component.css'],
})
export class BasicDialogComponent {

  checked: boolean[];
  isConfirm: boolean;
  constructor(public dialogRef: MatDialogRef<BasicDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData,
              private sanitizer: DomSanitizer,
              ) {
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
