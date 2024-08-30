import {Component, OnInit} from '@angular/core';
import {Chargepoint} from "../../models/chargepoint";
import {ChargepointService} from "../../service/chargepoint.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {CSService} from "../../service/cs.service";
import {ErrorService} from "../../service/error.service";
import {CsResponse} from "../../models/cs-response";
import {DialogData} from "../../models/dialog-data";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {AccountService} from "../../service/account.service";
import {PaymentMethod} from "../../models/payment-method";
import {PaymentMethodComponent} from "../user-profile/payment-method/payment-method.component";
import {PaymentPlan} from "../../models/payment-plan";
import {TransactionService} from "../../service/transaction.service";
import {AppModule} from "../../app.module";
import {getConnectorName} from "../../models/connector";
import {LocalStorageService} from "../../service/local-storage.service";

@Component({
  selector: 'app-chargepoint-screen',
  templateUrl: './chargepoint-screen.component.html',
  styleUrl: './chargepoint-screen.component.css'
})
export class ChargepointScreenComponent implements OnInit{
  chargePointId: string;
  connectorId: number;
  chargePoint: Chargepoint;
  connectorName: string = "";
  paymentMethod: PaymentMethod | undefined;
  paymentPlan: PaymentPlan | undefined;
  transactionId: number = -1;
  isStarted: boolean = false;
  isAvailable: boolean = false;
  constructor(
    private authService: AccountService,
    private chargePointService: ChargepointService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private csService: CSService,
    private errorService: ErrorService,
    private localStorageService: LocalStorageService,
  ) {
  }

  ngOnInit(): void {

    this.route.queryParams.subscribe((params: Params) => {
      this.chargePointId = params['charge_point_id'];
      this.connectorId = parseInt(params['connector_id']);
      this.authService.user.subscribe((user) => {
        if(!user){
          this.localStorageService.saveRedirectUrl(this.chargePointId, this.connectorId);
          this.router.navigate(['account/login']);
        }

        this.authService.authState$.subscribe((auth) => {
          if (auth) {
            this.chargePointService.subscribeOnUpdates();
            this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
              this.chargePoint= chargePoint;
              const connector = chargePoint.connectors.find((c) => c.connector_id == this.connectorId.toString());
              if (connector) {
                this.isAvailable = connector.status != "Faulted";
                this.connectorName = getConnectorName(connector);
                if(connector.current_transaction_id != -1){
                  this.isStarted = false;
                  this.transactionId = connector.current_transaction_id;
                }

                if(!this.isAvailable && connector.current_transaction_id == -1){
                  this.alertDialog("Connector is not available");
                }
              }
            });
            this.authService.getUserInfo(user.username).subscribe((info) => {
              this.paymentMethod = info.payment_methods?.find((pm) => pm.is_default);
              this.paymentPlan = info.payment_plans?.find((pp) => pp.is_active);
            });
          }
        });
      });


    });

    window.scrollTo(0, 0);

  }

  close(): void {
    this.router.navigate(['/points']);
  }

  start(): void {
    const connector = this.chargePoint.connectors.find((c) => c.connector_id == this.connectorId.toString());
    this.isStarted = true;
    this.csService.startTransaction(this.chargePointId, this.connectorId).subscribe({
      next: (result) => {
        const resp = (JSON.parse(result.info) as CsResponse);
        if (resp.status == "Accepted" && result.status == 'success') {
          if (connector?.status != "Preparing") {
            this.alertDialog("Connect your car");
          }
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
  }

  alertDialog(text: string): void {
    let dialogData: DialogData = {
      title: "Alert",
      content: text,
      buttonYes: "Ok",
      buttonNo: "",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {

      }
    });
  }

  addPaymentMethod() {
    this.router.navigate(['/user-profile']).then(() => {});
  }


  protected readonly getConnectorName = getConnectorName;
}
