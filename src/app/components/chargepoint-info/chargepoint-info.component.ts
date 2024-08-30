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
import {ErrorService} from "../../service/error.service";
import {environment} from "../../../environments/environment";


@Component({
  selector: 'app-chargepoint-info',
  templateUrl: './chargepoint-info.component.html',
  styleUrls: ['./chargepoint-info.component.css']
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
    private errorService: ErrorService,
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
    this.router.navigate(['/']);
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
      } else {
        //do nothing
        console.log("reboot cancelled")
      }
    });
  }

  softReboot(){
    this.csService.softRebootChargePoint(this.chargePointId).subscribe((response) => {
      if (response.status === 'success') {
        this.errorService.handle("Soft Reset")
      } else {
        this.errorService.handle(response.info)
        if (environment.debug) {
          console.log(response)
        }
      }
    });
  }

  hardReboot(){
    this.csService.hardRebootChargePoint(this.chargePointId).subscribe((response) => {
      if (response.status === 'success') {
        this.errorService.handle("Hard Reset")
      } else {
        this.errorService.handle(response.info)
        if (environment.debug) {
          console.log(response)
        }
      }
    });
  }

}
