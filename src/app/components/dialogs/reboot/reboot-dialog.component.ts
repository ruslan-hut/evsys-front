import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-reboot-dialog',
  templateUrl: './reboot-dialog.component.html',
  styleUrls: ['./reboot-dialog.component.css'],
})
export class RebootDialogComponent {
  constructor(public dialogRef: MatDialogRef<RebootDialogComponent>) {}
}
