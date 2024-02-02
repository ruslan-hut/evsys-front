import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DialogData} from "../../../models/dialog-data";

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
              ) {
    this.checked = new Array<boolean>(this.data.checkboxes.length);
    this.checked.fill(false);
    this.isConfirm = true;
  }

  getContent(): string {
    if(this.data.content != ""){
      return this.data.content;
    }
    return "Are you sure?";
  }

  onChecked(i: number){
    this.checked[i] = !this.checked[i];
    this.isConfirm = !this.checked.every((value) => value);
  }
}
