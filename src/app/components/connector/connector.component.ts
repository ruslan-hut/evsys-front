import {Component, Input} from "@angular/core"
import {Connector} from "../../models/connector";
import {MatDialog} from "@angular/material/dialog";
import {Router} from "@angular/router";
import { MatCardContent } from "@angular/material/card";
import { MatButton } from "@angular/material/button";
import { NgStyle, TitleCasePipe } from "@angular/common";

@Component({
    selector: 'app-connector',
    templateUrl: './connector.component.html',
    styleUrls: ['./connector.component.css'],
    standalone: true,
    imports: [MatCardContent, MatButton, NgStyle, TitleCasePipe]
})
export class ConnectorComponent {
  @Input() connector: Connector

  constructor(
    public dialog: MatDialog,
    private router: Router,
  ) {
  }

  getConnectorColor() {
    if (this.connector.state === "available") {
      return "limegreen";
    } else if (this.connector.state === "occupied") {
      return "orange";
    } else if (this.connector.current_transaction_id>-1){
      return "indigo";
    }else {
      return "red";
    }
  }

  isDisabled() {
    return this.connector.status.toLowerCase() === "unavailable";
  }

  getConnectorName(): string {
    if(this.connector.connector_id_name!="") {
      return this.connector.connector_id_name;
    } else {
      return this.connector.connector_id;
    }
  }

  getConnectorTypeIcon(): string {
   switch (this.connector.type) {
      case "Type 2":
        return "assets/icons/ev_plug_type1.svg";
      case "Type 1":
        return "assets/icons/ev_plug_type2.svg";
      case "CHAdeMO":
        return "assets/icons/ev_plug_chademo.svg";
      case "CCS1":
        return "assets/icons/ev_plug_ccs1.svg";
      case "CCS2":
        return "assets/icons/ev_plug_ccs2.svg";
      default:
        return "assets/icons/power.svg";
   }
  }

  openInfo() {

    // const dialogRef = this.dialog.open(ConnectorInfoComponent, {
    //   data: this.connector,
    // });

    this.router.navigate(['new-transactions'], {
      queryParams: { charge_point_id: this.connector.charge_point_id, connector_id: this.connector.connector_id }
    }).then(_ => {});

  }

  // transactionInfo() {
  //   // const dialogRef = this.dialog.open(TransactionInfoComponent, {
  //   //   width: '350px',
  //   //   data: this.connector.current_transaction_id,
  //   // });
  //   this.router.navigate(['new-transactions'], {
  //     queryParams: { charge_point_id: this.connector.charge_point_id, connector_id: this.connector.connector_id }
  //   });
  // }
}
