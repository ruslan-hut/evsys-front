import {Component, Inject, Input, OnInit, Optional} from "@angular/core";
import {Connector} from "../../models/connector";
import {DialogData} from "../../models/dialog-data";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {TimeService} from "../../service/time.service";
import {AccountService} from "../../service/account.service";
import {CSService} from "../../service/cs.service";
import {environment} from "../../../environments/environment";
import {User} from "../../models/user";
import {CsResponse} from "../../models/cs-response";
import {ErrorService} from "../../service/error.service";
import {ChargepointService} from "../../service/chargepoint.service";

@Component({
  selector: 'app-connector-info',
  templateUrl: './connector-info.component.html',
  styleUrls: ['./connector-info.component.css']
})
export class ConnectorInfoComponent implements OnInit {

  @Input() connector: Connector | undefined;

  constructor(
    private csService: CSService,
    private errorService: ErrorService,
    private chargePointService: ChargepointService,
    public dialog: MatDialog,
    public timeService: TimeService,
    @Optional() public dialogRef?: MatDialogRef<BasicDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: Connector,
  ) {
    if (data) {
      this.connector = data;
    }
  }

  ngOnInit(): void {
    if(this.connector){
      this.chargePointService.subscribeOnUpdates();
      this.chargePointService.getChargePoints().subscribe((chargePoint) => {
        const chargePointId = this.connector?.charge_point_id;
        const connectorId = this.connector?.connector_id;
        chargePoint.forEach((cp) => {
          if (cp.charge_point_id=== chargePointId) {
            cp.connectors.forEach((c) => {
              if (c.connector_id === connectorId) {
                this.connector = c;
              }
            });
          }
        });
        console.log(chargePoint);
      });
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
        this.csService.startTransaction(connector.charge_point_id, parseInt(connector.connector_id)).subscribe({
          next: (result) => {
            const resp = (JSON.parse(result.info) as CsResponse);
            if (resp.status == "Accepted" && result.status == 'success') {
              console.log("Transaction started")
            } else {
              if (resp.error != null) {
                this.errorService.handle(resp.error);
              }else{
                this.errorService.handle(resp.status);
              }
              console.log(result)
            }
          }
        });
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
        this.csService.stopTransaction(connector.charge_point_id, parseInt(connector.connector_id), connector.current_transaction_id.toString()).subscribe({
          next: (result) => {
            const resp = (JSON.parse(result.info) as CsResponse);
            if (resp.status == "Accepted" && result.status == 'success') {
              console.log("Transaction stopped")
            } else {
              if (resp.error != null) {
                this.errorService.handle(resp.error);
              }
              else {
                this.errorService.handle(resp.status);
              }
              console.log(result)
            }
          }
        });
      } else {
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
        this.csService.unlockConnector(connector.charge_point_id, parseInt(connector.connector_id)).subscribe({
          next: (result) => {
            const resp = (JSON.parse(result.info) as CsResponse);
            if (resp.status == "Accepted" && result.status == 'success') {
              console.log("Connector unlocked")
            } else {
              if (resp.error != null) {
                this.errorService.handle(resp.error);
              }else{
                this.errorService.handle(resp.status);
              }
              console.log(result)
            }
          }
        });
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
