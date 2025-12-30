import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DialogData } from '../../models/dialog-data';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PromoDialogComponent } from '../dialogs/promo-dialog/promo-dialog.component';
import { Chargepoint } from '../../models/chargepoint';
import { ChargepointService } from '../../service/chargepoint.service';
import { Connector } from '../../models/connector';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow } from '@angular/material/expansion';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SortConnectorsPipe } from '../pipes/sortConnectorsPipe';

@Component({
  selector: 'app-promo',
  templateUrl: './promo.component.html',
  styleUrls: ['./promo.component.css'],
  standalone: true,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow, MatButton, MatCardActions, MatIcon, SortConnectorsPipe]
})
export class PromoComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private promoCode: string;

  chargePointId: string;
  chargePoint: Chargepoint;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private chargePointService: ChargepointService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap((params: Params) => {
        const code = params['promoCode'];
        if (code != null && code !== '') {
          localStorage.setItem('promoCode', code);
        }
        this.chargePointId = params['id'];
        return this.chargePointService.getChargePoint(this.chargePointId);
      })
    ).subscribe((chargePoint) => {
      this.chargePoint = chargePoint;
    });
  }

  ngAfterViewInit(): void {
    this.loadPromo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPromo(): void {
    const code = localStorage.getItem('promoCode');
    if (code != null && code !== '' && code !== undefined) {
      this.promoCode = code;
    } else {
      this.promoCode = '';
    }
  }

  showAlertPromoDialog(): void {
    let content = 'Please enter a new promo code.';
    if (this.promoCode != null && this.promoCode !== '' && this.promoCode !== undefined) {
      content = 'Your promo code: ' + this.promoCode + ' is not valid. Please enter a new one, or pay as usual.';
    }
    const dialogData: DialogData = {
      title: 'Promo code',
      content: content,
      buttonYes: 'New code',
      buttonNo: 'Cancel',
      buttonAction: 'Pay',
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      data: dialogData,
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      switch (result) {
        case 'yes':
          this.showPromoDialog();
          break;
        case 'no':
          break;
        case 'action':
          break;
      }
    });
  }

  showPromoDialog(): void {
    const dialogRef = this.dialog.open(PromoDialogComponent, {});

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result === 'yes') {
        this.loadPromo();
      }
    });
  }

  close(): void {
    this.router.navigate(['/promo']);
  }

  getConnectorColor(connector: Connector): string {
    if (connector.state === 'available') {
      return 'limegreen';
    } else if (connector.state === 'occupied') {
      return 'orange';
    } else {
      return 'red';
    }
  }

  startConnector(_: Connector): void {
    if (this.validatePromoCode()) {
      // Start transaction
    } else {
      this.showAlertPromoDialog();
    }
  }

  stopConnector(_: Connector): void {
    if (this.validatePromoCode()) {
      // Stop transaction
    } else {
      this.showAlertPromoDialog();
    }
  }

  unlockConnector(_: Connector): void {
    if (this.validatePromoCode()) {
      // Unlock connector
    } else {
      this.showAlertPromoDialog();
    }
  }

  validatePromoCode(): boolean {
    return this.promoCode === 'hoot1';
  }
}
