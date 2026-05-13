import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
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
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-promo',
  templateUrl: './promo.component.html',
  styleUrls: ['./promo.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatExpansionPanelDescription, MatExpansionPanelActionRow, MatButton, MatCardActions, MatIcon, SortConnectorsPipe, TranslatePipe]
})
export class PromoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly dialog = inject(MatDialog);
  private readonly chargePointService = inject(ChargepointService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  private destroy$ = new Subject<void>();
  private promoCode: string;

  chargePointId: string;
  chargePoint: Chargepoint;

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
      this.cdr.markForCheck();
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
    let content = this.translate.instant('promo.enterNewCode');
    if (this.promoCode != null && this.promoCode !== '' && this.promoCode !== undefined) {
      content = this.translate.instant('promo.invalidCode', {code: this.promoCode});
    }
    const dialogData: DialogData = {
      title: this.translate.instant('promo.dialogTitle'),
      content: content,
      buttonYes: this.translate.instant('promo.newCode'),
      buttonNo: this.translate.instant('promo.cancel'),
      buttonAction: this.translate.instant('promo.pay'),
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
