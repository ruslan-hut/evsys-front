import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import {ModalService} from "../../service/modal.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";
import {Connector} from "../../models/connector";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {BasicDialogComponent} from "../dialogs/basic/basic-dialog.component";
import {DialogData} from "../../models/dialogData";


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
    private modalService: ModalService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.route.params.subscribe((params: Params) => {
      this.chargePointId = params['id'];
      this.chargePointService.init();
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
      buttonNo: "Close"
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

  getTimeDifference(date: string): string {
    const eventTime = new Date(date);
    const now = new Date();
    const differenceInSeconds = Math.floor((now.getTime() - eventTime.getTime()) / 1000);

    const days = Math.floor(differenceInSeconds / (3600 * 24));
    const hours = Math.floor((differenceInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((differenceInSeconds % 3600) / 60);

    let result = '';
    if (days > 0) {
      result += `${days} d. `;
    }
    if (hours > 0) {
      result += `${hours} h. `;
    }
    if (minutes > 0) {
      result += `${minutes} min. `;
    }

    return result.length > 0 ? result : 'now';
  }

}
