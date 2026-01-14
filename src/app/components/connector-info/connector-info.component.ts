import { Component, Inject, Input, OnInit, OnDestroy, Optional, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Connector } from '../../models/connector';
import { DialogData } from '../../models/dialog-data';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TimeService } from '../../service/time.service';
import { AccountService } from '../../service/account.service';
import { CSService } from '../../service/cs.service';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user';
import { ErrorService } from '../../service/error.service';
import { ChargepointService } from '../../service/chargepoint.service';
import { Router } from '@angular/router';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow } from '@angular/material/expansion';
import { MatButton } from '@angular/material/button';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-connector-info',
  templateUrl: './connector-info.component.html',
  styleUrls: ['./connector-info.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow, MatButton, NgClass]
})
export class ConnectorInfoComponent implements OnInit, OnDestroy {
  private readonly csService = inject(CSService);
  private readonly errorService = inject(ErrorService);
  private readonly chargePointService = inject(ChargepointService);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  readonly timeService = inject(TimeService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly dialogRef = inject(MatDialogRef<BasicDialogComponent>, { optional: true });
  readonly data = inject<Connector>(MAT_DIALOG_DATA, { optional: true });

  private destroy$ = new Subject<void>();

  @Input() connector: Connector | undefined;

  constructor() {
    if (this.data) {
      this.connector = this.data;
    }
  }

  ngOnInit(): void {
    if (this.connector) {
      this.chargePointService.subscribeOnUpdates();

      this.chargePointService.getChargePoints().pipe(
        takeUntil(this.destroy$)
      ).subscribe((chargePoints) => {
        const chargePointId = this.connector?.charge_point_id;
        const connectorId = this.connector?.connector_id;
        chargePoints.forEach((cp) => {
          if (cp.charge_point_id === chargePointId) {
            cp.connectors.forEach((c) => {
              if (c.connector_id === connectorId) {
                this.connector = c;
              }
            });
          }
        });
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chargePointService.unsubscribeFromUpdates();
  }

  isDialog(): boolean {
    return !!this.data;
  }

  canStartTransaction(connector: Connector): boolean {
    // Allow start if connector is available, or if it's in 'occupied' state with 'Preparing' status
    const isPreparingState = connector.state === 'occupied' && connector.status === 'Preparing';
    return connector.state === 'available' || isPreparingState;
  }

  onStartConnector(connector: Connector): void {
    this.accountService.user$.pipe(
      take(1)
    ).subscribe((user: User | null) => {
      if (user) {
        this.accountService.getUserInfo(user.username).pipe(
          take(1)
        ).subscribe((userInfo) => {
          if (userInfo.payment_methods) {
            let hasPaymentMethod = false;
            userInfo.payment_methods.forEach((pm) => {
              if (this.isPaymentMethodValid(pm.expiry_date)) {
                hasPaymentMethod = true;
              }
            });

            if (hasPaymentMethod) {
              this.startConnector(connector);
            } else {
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
      const year = parseInt('20' + expiryDate.substring(0, 2), 10);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        return true;
      }
    }

    return false;
  }

  addPaymentMethod(): void {
    const dialogData: DialogData = {
      title: 'Add Payment Method',
      content: 'You need to add a payment method to start a transaction',
      buttonYes: 'Add Payment Method',
      buttonNo: 'Close',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '400px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.dialog.closeAll();
        this.router.navigate(['/payment-methods']).then(() => {
          if (!result) {
            if (environment.debug) {
              console.log(result);
            }
            this.errorService.handle('Failed to delete payment method');
          }
        });
      }
    });
  }

  startConnector(connector: Connector): void {
    const dialogData: DialogData = {
      title: 'Start',
      content: '',
      buttonYes: 'Start',
      buttonNo: 'Close',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '300px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.csService.startTransaction(connector.charge_point_id, parseInt(connector.connector_id)).pipe(
          take(1)
        ).subscribe({
          next: (result) => {
            this.csService.processCentralSystemResponse(result, 'Transaction started');
          }
        });
      }
    });
  }

  stopConnector(connector: Connector): void {
    const dialogData: DialogData = {
      title: 'Stop',
      content: '',
      buttonYes: 'Stop',
      buttonNo: 'Close',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '300px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.csService.stopTransaction(connector.charge_point_id, parseInt(connector.connector_id), connector.current_transaction_id.toString()).pipe(
          take(1)
        ).subscribe({
          next: (result) => {
            this.csService.processCentralSystemResponse(result, 'Transaction stopped');
          }
        });
      }
    });
  }

  unlockConnector(connector: Connector): void {
    const dialogData: DialogData = {
      title: 'Unlock',
      content: '',
      buttonYes: 'Unlock',
      buttonNo: 'Close',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '100%',
      maxWidth: '300px',
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.csService.unlockConnector(connector.charge_point_id, parseInt(connector.connector_id)).pipe(
          take(1)
        ).subscribe({
          next: (result) => {
            this.csService.processCentralSystemResponse(result, 'Connector unlocked');
          }
        });
      }
    });
  }

  getConnectorStatusClass(connector: Connector): string {
    if (connector.state === 'available') {
      return 'status-available';
    } else if (connector.state === 'occupied') {
      return 'status-occupied';
    } else {
      return 'status-error';
    }
  }
}
