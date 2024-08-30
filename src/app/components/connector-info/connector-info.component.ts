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
import {ErrorService} from "../../service/error.service";
import {ChargepointService} from "../../service/chargepoint.service";
import {Router} from "@angular/router";

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
    private accountService: AccountService,
    private router: Router,
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
      });
    }

  }

  isDialog(): boolean {
    return !!this.data;

  }

  onStartConnector(connector: Connector) {
    this.accountService.user.subscribe((user: User | null) => {
      if (user) {
        this.accountService.getUserInfo(user.username).subscribe((userInfo) => {
          if (userInfo.payment_methods) {
            let hasPaymentMethod = false;
            userInfo.payment_methods.forEach((pm) => {
                if(this.isPaymentMethodValid(pm.expiry_date)){
                  hasPaymentMethod = true;
                }
            });

            if (hasPaymentMethod) {
                this.startConnector(connector);
            }else {
              this.addPaymentMethod();
            }
          } else {
            this.addPaymentMethod();
          }
        });
      }
    });
  }

  isPaymentMethodValid(expiryDate: string): boolean {
    if (expiryDate && expiryDate.length === 4) {
      const month = parseInt(expiryDate.substring(2, 4), 10);
      const year = parseInt('20' + expiryDate.substring(0, 2), 10); // Assuming dates are in the 2000s

      // Get the current date
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

      // Check if the expiry date is in the future
      if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        return true;
      }
    }

    return false;
  }

  addPaymentMethod() {
    let dialogData: DialogData = {
      title: "Add Payment Method",
      content: "You need to add a payment method to start a transaction",
      buttonYes: "Add Payment Method",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.dialog.closeAll();
        this.router.navigate(['/payment-methods']).then(() => {
          if (!result) {
            if (environment.debug) {
              console.log(result)
            }
            this.errorService.handle("Failed to delete payment method")
          }
        });
      }
    });
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
            this.csService.processCentralSystemResponse(result, "Transaction started")
          }
        });
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
            this.csService.processCentralSystemResponse(result, "Transaction stopped")
          }
        });
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
            this.csService.processCentralSystemResponse(result, "Connector unlocked")
          }
        });
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
