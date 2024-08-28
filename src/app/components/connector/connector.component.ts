import {Component, Input} from "@angular/core"
import {Connector} from "../../models/connector";
import {MatDialog} from "@angular/material/dialog";
import {ConnectorInfoComponent} from "../connector-info/connector-info.component";
import {TransactionInfoComponent} from "../transaction-info/transaction-info.component";
import {Router} from "@angular/router";

@Component({
  selector: 'app-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.css']
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
    } else {
      return "red";
    }
  }

  getConnectorName(): string {
    if(this.connector.connector_id_name!="") {
      return this.connector.connector_id_name;
    } else {
      return this.connector.connector_id;
    }
  }

  openInfo() {

    // const dialogRef = this.dialog.open(ConnectorInfoComponent, {
    //   data: this.connector,
    // });

    this.router.navigate(['new-transactions'], {
      queryParams: { charge_point_id: this.connector.charge_point_id, connector_id: this.connector.connector_id }
    });

  }

  transactionInfo() {
    // const dialogRef = this.dialog.open(TransactionInfoComponent, {
    //   width: '350px',
    //   data: this.connector.current_transaction_id,
    // });
    this.router.navigate(['new-transactions'], {
      queryParams: { charge_point_id: this.connector.charge_point_id, connector_id: this.connector.connector_id }
    });
  }
}
