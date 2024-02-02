import {Component, Inject, Input, Optional} from "@angular/core";
import {Connector} from "../../models/connector";
import {DialogData} from "../../models/dialog-data";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {TimeService} from "../../service/time.service";

@Component({
  selector: 'app-connector-info',
  templateUrl: './connector-info.component.html',
  styleUrls: ['./connector-info.component.css']
})
export class ConnectorInfoComponent {

  @Input() connector: Connector;

  constructor(
    public dialog: MatDialog,
    public timeService: TimeService,
    @Optional() public dialogRef?: MatDialogRef<BasicDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: Connector,
  ) {
    if (data) {
      this.connector = data;
    }
  }

  isDialog(): boolean {
    return !!this.data;

  }

  startConnector(connector: Connector) {
    let dialogData: DialogData = {
      title: "Start",
      content: "",
      buttonYes: "Start",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        //basic code
        console.log("starting")
      } else {
        //do nothing
        console.log("not starting")
      }
    });
  }
  stopConnector(connector: Connector) {
    let dialogData: DialogData = {
      title: "Stop",
      content: "",
      buttonYes: "Stop",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        //basic code
        console.log("stopping")
      } else {
        //do nothing
        console.log("not stopping")
      }
    });
  }
  unlockConnector(connector: Connector) {
    let dialogData: DialogData = {
      title: "Unlock",
      content: "",
      buttonYes: "Unlock",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        //basic code
        console.log("unlocking")
      } else {
        //do nothing
        console.log("not unlocking")
      }
    });
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
}
