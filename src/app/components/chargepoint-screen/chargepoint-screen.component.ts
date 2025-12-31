import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Chargepoint } from '../../models/chargepoint';
import { ChargepointService } from '../../service/chargepoint.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogData } from '../../models/dialog-data';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { AccountService } from '../../service/account.service';
import { PaymentMethod } from '../../models/payment-method';
import { PaymentPlan } from '../../models/payment-plan';
import { getConnectorName } from '../../models/connector';
import { LocalStorageService } from '../../service/local-storage.service';
import { TransactionService } from '../../service/transaction.service';
import { DecimalPipe } from '@angular/common';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { PaymentMethodComponent } from '../user-profile/payment-method/payment-method.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-chargepoint-screen',
  templateUrl: './chargepoint-screen.component.html',
  styleUrl: './chargepoint-screen.component.css',
  standalone: true,
  imports: [MatCard, MatCardContent, PaymentMethodComponent, MatButton, MatIcon, MatProgressBar, MatCardActions, DecimalPipe]
})
export class ChargepointScreenComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  chargePointId: string;
  connectorId: number;
  chargePoint: Chargepoint;
  connectorName: string = '';
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
  ) {}

  ngOnInit(): void {
    this.loadData();
    window.scrollTo(0, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // Combine route params with user state
    combineLatest([
      this.route.queryParams,
      this.authService.user$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([params, user]) => {
      this.chargePointId = params['charge_point_id'];
      this.connectorId = parseInt(params['connector_id']);

      if (!user) {
        this.localStorageService.saveRedirectUrl(this.chargePointId, this.connectorId);
        this.router.navigate(['account/login']).then(() => {});
        return;
      }

      this.loadChargePointData(user.username);
    });

    // Listen for transaction start
    this.transactionService.transactionId.pipe(
      takeUntil(this.destroy$),
      filter(id => id !== -1)
    ).subscribe((transactionId) => {
      this.transactionId = transactionId;
      this.goToTransaction();
    });
  }

  private loadChargePointData(username: string): void {
    // Load charge point
    this.chargePointService.getChargePoint(this.chargePointId).pipe(
      take(1)
    ).subscribe((chargePoint) => {
      this.chargePoint = chargePoint;
      const connector = chargePoint.connectors.find((c) => c.connector_id === this.connectorId.toString());

      if (connector) {
        // Allow start if connector is available, or if it's in 'occupied' state with 'Preparing' status
        const isPreparingState = connector.state === 'occupied' && connector.status === 'Preparing';
        this.isAvailable = connector.status !== 'Faulted' && (connector.state === 'available' || isPreparingState);
        this.connectorName = getConnectorName(connector);
        this.transactionId = connector.current_transaction_id;

        if (this.transactionId !== -1) {
          this.goToTransaction();
        }

        if (!this.isAvailable && connector.current_transaction_id === -1) {
          this.alertDialog('Connector is not available');
        }
      }
    });

    // Load user payment info
    this.authService.getUserInfo(username).pipe(
      take(1)
    ).subscribe((info) => {
      this.paymentMethod = info.payment_methods?.find((pm) => pm.is_default);
      this.paymentPlan = info.payment_plans?.find((pp) => pp.is_active);
    });
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
    const dialogData: DialogData = {
      title: 'Alert',
      content: text,
      buttonYes: 'Ok',
      buttonNo: '',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(_ => {
      // Dialog closed
    });
  }

  addPaymentMethod(): void {
    this.router.navigate(['/user-profile']).then(() => {});
  }
}
