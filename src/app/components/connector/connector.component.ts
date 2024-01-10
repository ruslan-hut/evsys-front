import {Component, Input} from "@angular/core"
import {Connector} from "../../models/connector";
import {MatButtonModule} from '@angular/material/button';
import {DialogData} from "../../models/dialogData";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {ConnectorInfoComponent} from "../connector-info/connector-info.component";

@Component({
  selector: 'app-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.css']
})
export class ConnectorComponent {
  @Input() connector: Connector

  constructor(
    public dialog: MatDialog
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

    const dialogRef = this.dialog.open(ConnectorInfoComponent, {
      data: this.connector,
    });

  }
}
