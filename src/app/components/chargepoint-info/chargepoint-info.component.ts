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
import { DiagnosticsDialogComponent, DiagnosticsDialogData } from '../dialogs/diagnostics/diagnostics-dialog.component';
import { DialogData } from '../../models/dialog-data';
import { CsCommandResponse } from '../../models/cs-command-response';
import { TimeService } from '../../service/time.service';
import { CSService } from '../../service/cs.service';
import { ErrorService } from '../../service/error.service';
import { AccountService } from '../../service/account.service';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatAccordion } from '@angular/material/expansion';
import { ConnectorInfoComponent } from '../connector-info/connector-info.component';
import { ChargepointProfileComponent } from '../chargepoint-profile/chargepoint-profile.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SortConnectorsPipe } from '../pipes/sortConnectorsPipe';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-chargepoint-info',
  templateUrl: './chargepoint-info.component.html',
  styleUrls: ['./chargepoint-info.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatAccordion, ConnectorInfoComponent, ChargepointProfileComponent, MatCardActions, MatButton, MatIcon, SortConnectorsPipe, TranslatePipe]
})
export class ChargepointInfoComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargepointService);
  readonly timeService = inject(TimeService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  readonly dialog = inject(MatDialog);
  private readonly csService = inject(CSService);
  private readonly errorService = inject(ErrorService);
  readonly accountService = inject(AccountService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  private destroy$ = new Subject<void>();

  // The upload URL is remembered between requests so an operator does not retype
  // the FTP location every time; it is the same across charge points in practice.
  private static readonly DIAG_LOCATION_KEY = 'diagnostics.uploadLocation';

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
      title: this.translate.instant('chargepointInfoActions.resetTitle'),
      content: '',
      buttonYes: this.translate.instant('chargepointInfoActions.resetButton'),
      buttonNo: this.translate.instant('common.close'),
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
      this.csService.processCentralSystemResponse(response, this.translate.instant('chargepointInfoActions.softResetProgress'));
    });
  }

  hardReboot(): void {
    this.csService.hardRebootChargePoint(this.chargePointId).pipe(
      take(1)
    ).subscribe((response) => {
      this.csService.processCentralSystemResponse(response, this.translate.instant('chargepointInfoActions.hardResetProgress'));
    });
  }

  // GetDiagnostics tells the charge point to upload its log file to a URL it can
  // reach. The operator supplies that URL; there is no server-side default, so
  // the dialog pre-fills the last one used.
  requestDiagnostics(): void {
    const data: DiagnosticsDialogData = {
      chargePointId: this.chargePointId,
      defaultLocation: localStorage.getItem(ChargepointInfoComponent.DIAG_LOCATION_KEY) ?? ''
    };
    const dialogRef = this.dialog.open(DiagnosticsDialogComponent, {
      width: '100%',
      maxWidth: '420px',
      data
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((location: string | undefined) => {
      if (!location) return;
      localStorage.setItem(ChargepointInfoComponent.DIAG_LOCATION_KEY, location);
      this.csService.getDiagnostics(this.chargePointId, location).pipe(
        take(1)
      ).subscribe((response) => this.handleDiagnosticsResponse(response));
    });
  }

  // The charge point answers with the name of the file it will upload, or an
  // empty body when it has nothing to send. That is all the /csc round trip can
  // report; the upload itself happens out of band over FTP and its outcome
  // arrives later as a DiagnosticsStatusNotification.
  private handleDiagnosticsResponse(response: CsCommandResponse): void {
    if (response.status !== 'success') {
      this.errorService.handle(this.translate.instant('diagnostics.failed'));
      return;
    }
    let fileName = '';
    try {
      fileName = (JSON.parse(response.info) as { fileName?: string }).fileName ?? '';
    } catch {
      // an unparseable body still means the command was accepted
    }
    this.errorService.handle(
      fileName
        ? this.translate.instant('diagnostics.uploading', { file: fileName })
        : this.translate.instant('diagnostics.nothing')
    );
  }
}
