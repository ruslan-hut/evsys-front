import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";
import {MatDialog} from "@angular/material/dialog";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../models/dialog-data";
import {TimeService} from "../../service/time.service";
import {CSService} from "../../service/cs.service";

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
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatAccordion, ConnectorInfoComponent, MatCardActions, MatButton, MatIcon, SortConnectorsPipe]
})
export class ChargepointInfoComponent implements OnInit{

  chargePointId: string;
  chargePoint: Chargepoint;
  constructor(
    private chargePointService: ChargepointService,
    public timeService: TimeService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private csService: CSService,
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      //this.chargePointService.init();
      this.chargePointService.getChargePoint(this.chargePointId).subscribe((chargePoint) => {
        this.chargePoint= chargePoint;
      });
    });
    window.scrollTo(0, 0);

  }

  form = new FormGroup({
    title: new FormControl<string>("")
  })

  close(){
    this.router.navigate(['/']).then(() => {});
  }

  reboot(mode: number): void {
    let dialogData: DialogData = {
      title: "Reset",
      content: "",
      buttonYes: "Reset",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        if(mode == 0){
          this.hardReboot();
        }
        else {
          this.softReboot();
        }
      }
    });
  }

  softReboot(){
    this.csService.softRebootChargePoint(this.chargePointId).subscribe((response) => {
      this.csService.processCentralSystemResponse(response, "Performing soft reset")
    });
  }

  hardReboot(){
    this.csService.hardRebootChargePoint(this.chargePointId).subscribe((response) => {
      this.csService.processCentralSystemResponse(response, "Performing hard reset")
    });
  }

}
