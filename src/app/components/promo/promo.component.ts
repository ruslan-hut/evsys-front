import {Component, Input} from '@angular/core';
import {ActivatedRoute, Params, Router} from "@angular/router";
import {OnInit, AfterViewInit} from "@angular/core";
import {DialogData} from "../../models/dialog-data";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {PromoDialogComponent} from "../dialogs/promo-dialog/promo-dialog.component";
import {Chargepoint} from "../../models/chargepoint";
import {ChargepointService} from "../../service/chargepoint.service";
import {Connector} from "../../models/connector";

@Component({
  selector: 'app-promo',
  templateUrl: './promo.component.html',
  styleUrls: ['./promo.component.css']
})
export class PromoComponent implements OnInit, AfterViewInit{
  private promoCode: string;
  chargePointId: string;
  chargePoint: Chargepoint;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private chargePointService: ChargepointService,
    ) {

  }
  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      const code = params['promoCode'];
      if(code != null && code != ''){
        localStorage.setItem('promoCode', code);
      }
      this.chargePointId = params['id'];
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint= chargePoint;
      });

    });
  }

  ngAfterViewInit(): void {
    this.loadPromo();
  }

  loadPromo(){
    const code = localStorage.getItem('promoCode');
    if(code != null && code != '' && code != undefined){
      this.promoCode = code;
    }else {
      this.promoCode = '';
    }
  }

  showAlertPromoDialog(){
    let content = "Please enter a new promo code.";
    if(this.promoCode != null && this.promoCode != '' && this.promoCode != undefined){
      content = "Your promo code: " + this.promoCode + " is not valid. Please enter a new one, or pay as usual.";
    }
    let dialogData: DialogData = {
      title: "Promo code",
      content: content,
      buttonYes: "New code",
      buttonNo: "Cancel",
      buttonAction: "Pay",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {

      switch (result) {
        case 'yes':
          this.showPromoDialog();
          break;
        case 'no':
          break;
        case 'action':
          break;
      }
    });
  }

  showPromoDialog(){

    const dialogRef = this.dialog.open(PromoDialogComponent, {
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == 'yes') {
        this.loadPromo();
      }
    });
  }

  close(){
    this.router.navigate(['/promo']);
  }

  getConnectorColor(connector: Connector) {
    if (connector.state === "available") {
      return "limegreen";
    } else if (connector.state === "occupied") {
      return "orange";
    } else {
      return "red";
    }
  }

  startConnector(connector: Connector) {
    if(this.validatePromoCode()){

    }
    else {
      this.showAlertPromoDialog();
    }
  }

  stopConnector(connector: Connector) {
    if(this.validatePromoCode()){

    }else {
      this.showAlertPromoDialog();
    }
  }

  unlockConnector(connector: Connector) {
    if(this.validatePromoCode()){

    }else {
      this.showAlertPromoDialog();
    }
  }

  validatePromoCode(): boolean {
    return this.promoCode == "hoot1";
  }
}
