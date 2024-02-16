import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-promo-dialog',
  templateUrl: './promo-dialog.component.html',
  styleUrls: ['./promo-dialog.component.css'],
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
