import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Subject } from 'rxjs';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';
import { ChargepointService } from '../../service/chargepoint.service';
import { ActivatedRoute, Params } from '@angular/router';
import { Chargepoint } from '../../models/chargepoint';
import { MatDialog } from '@angular/material/dialog';
import { BasicDialogComponent } from '../dialogs/basic/basic-dialog.component';
import { DialogData } from '../../models/dialog-data';
import { TimeService } from '../../service/time.service';
import { CSService } from '../../service/cs.service';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatAccordion } from '@angular/material/expansion';
import { ConnectorInfoComponent } from '../connector-info/connector-info.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SortConnectorsPipe } from '../pipes/sortConnectorsPipe';

@Component({
  selector: 'app-chargepoint-info',
  templateUrl: './chargepoint-info.component.html',
  styleUrls: ['./chargepoint-info.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatAccordion, ConnectorInfoComponent, MatCardActions, MatButton, MatIcon, SortConnectorsPipe]
})
export class ChargepointInfoComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargepointService);
  readonly timeService = inject(TimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  readonly dialog = inject(MatDialog);
  private readonly csService = inject(CSService);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  chargePointId!: string;
  chargePoint!: Chargepoint;

  form = new FormGroup({
    title: new FormControl<string>('')
  });

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap((params: Params) => {
        this.chargePointId = params['id'];
        return this.chargePointService.getChargePoint(this.chargePointId);
      })
    ).subscribe((chargePoint) => {
      this.chargePoint = chargePoint;
      this.cdr.markForCheck();
    });

    window.scrollTo(0, 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.location.back();
  }

  reboot(mode: number): void {
    const dialogData: DialogData = {
      title: 'Reset',
      content: '',
      buttonYes: 'Reset',
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
        if (mode === 0) {
          this.hardReboot();
        } else {
          this.softReboot();
        }
      }
    });
  }

  softReboot(): void {
    this.csService.softRebootChargePoint(this.chargePointId).pipe(
      take(1)
    ).subscribe((response) => {
      this.csService.processCentralSystemResponse(response, 'Performing soft reset');
    });
  }

  hardReboot(): void {
    this.csService.hardRebootChargePoint(this.chargePointId).pipe(
      take(1)
    ).subscribe((response) => {
      this.csService.processCentralSystemResponse(response, 'Performing hard reset');
    });
  }
}
