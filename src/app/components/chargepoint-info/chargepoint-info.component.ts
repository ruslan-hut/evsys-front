import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";
import {MatDialog} from "@angular/material/dialog";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../models/dialog-data";
import {TimeService} from "../../service/time.service";


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
    public dialog: MatDialog
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

  reboot(): void {
    let dialogData: DialogData = {
      title: "Reboot",
      content: "",
      buttonYes: "Reboot",
      buttonNo: "Close",
      checkboxes: []
    };

    const dialogRef = this.dialog.open(BasicDialogComponent, {
      width: '250px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        //basic code
        console.log("rebooting")
      } else {
        //do nothing
        console.log("not rebooting")
      }
    });
  }

}
