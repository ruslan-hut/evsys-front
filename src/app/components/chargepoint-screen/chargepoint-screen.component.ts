import {Component, OnInit} from '@angular/core';
import {Chargepoint} from "../../models/chargepoint";
import {ChargepointService} from "../../service/chargepoint.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {DialogData} from "../../models/dialog-data";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {AccountService} from "../../service/account.service";
import {PaymentMethod} from "../../models/payment-method";
import {PaymentPlan} from "../../models/payment-plan";
import {getConnectorName} from "../../models/connector";
import {LocalStorageService} from "../../service/local-storage.service";
import {TransactionService} from "../../service/transaction.service";

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
  isStarted: boolean = false;
  isAvailable: boolean = false;
  transactionId: number = -1;

  constructor(
    private authService: AccountService,
    private chargePointService: ChargepointService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private localStorageService: LocalStorageService,
    public transactionService: TransactionService,
  ) {
  }

  ngOnInit(): void {
    this.refreshData();
  }

  refreshData() {
    this.route.queryParams.subscribe((params: Params) => {

      this.chargePointId = params['charge_point_id'];
      this.connectorId = parseInt(params['connector_id']);

      this.authService.user.subscribe((user) => {
        if(!user){
          this.localStorageService.saveRedirectUrl(this.chargePointId, this.connectorId);
          this.router.navigate(['account/login']).then(() => {});
        }

        this.authService.authState$.subscribe((auth) => {
          if (auth) {

            this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {

              this.chargePoint= chargePoint;
              const connector = chargePoint.connectors.find((c) => c.connector_id == this.connectorId.toString());

              if (connector) {
                this.isAvailable = connector.status != "Faulted";
                this.connectorName = getConnectorName(connector);
                this.transactionId = connector.current_transaction_id;

                if(this.transactionId != -1){
                  this.goToTransaction();
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

        this.transactionService.transactionId.subscribe((transactionId) => {
          if(transactionId != -1){
            this.transactionId = transactionId;
            this.goToTransaction();
          }
        });


      });


    });

    window.scrollTo(0, 0);
  }

  close(): void {
    this.router.navigate(['/points']).then(_ => {});
  }

  start(): void {
    this.isStarted = true;
    this.transactionService.startTransaction(this.chargePointId, this.connectorId);
    setTimeout(() => {
      this.isStarted = false;
    }, 10000);
  }

  goToTransaction(): void {
    this.router.navigate(['/current-transaction'], { queryParams: { transaction_id: this.transactionId } }).then(() => {});
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

}
