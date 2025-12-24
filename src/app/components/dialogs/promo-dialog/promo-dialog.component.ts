import {Component, Inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';

@Component({
    selector: 'app-promo-dialog',
    templateUrl: './promo-dialog.component.html',
    styleUrls: ['./promo-dialog.component.css'],
    standalone: true,
    imports: [
        MatDialogTitle,
        CdkScrollable,
        MatDialogContent,
        MatFormField,
        MatInput,
        FormsModule,
        MatDialogActions,
        MatButton,
    ],
})
export class PromoDialogComponent {
  promoCode: string;
  constructor(public dialogRef: MatDialogRef<PromoDialogComponent>,
  ) {
  }

  confirm(){
    if(this.promoCode == null || this.promoCode == '' || this.promoCode == undefined){
      return;
    }
    localStorage.setItem('promoCode', this.promoCode);
    this.dialogRef.close("yes");
  }
}
