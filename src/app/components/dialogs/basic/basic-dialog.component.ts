import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from "../../../models/dialog-data";

@Component({
  selector: 'app-basic-dialog',
  templateUrl: './basic-dialog.component.html',
  styleUrls: ['./basic-dialog.component.css'],
})
export class BasicDialogComponent {
  constructor(public dialogRef: MatDialogRef<BasicDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: DialogData,
              ) {}

  getContent(): string {
    if(this.data.content != ""){
      return this.data.content;
    }
    return "Are you sure?";
  }
}
