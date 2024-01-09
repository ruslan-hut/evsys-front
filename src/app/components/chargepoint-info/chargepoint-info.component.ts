import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, FormsModule} from "@angular/forms";
import {ChargepointService} from "../../service/chargepoint.service";
import {ModalService} from "../../service/modal.service";
import { ActivatedRoute, Params, Router} from '@angular/router';
import {Chargepoint} from "../../models/chargepoint";
import {Connector} from "../../models/connector";
import {MatDialog} from "@angular/material/dialog";
import {RebootDialogComponent} from "../dialogs/reboot/reboot-dialog.component";


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
    const dialogRef = this.dialog.open(RebootDialogComponent, {
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        //reboot code
        console.log("rebooting")
      } else {
        //do nothing
        console.log("not rebooting")
      }
    });
  }

  getConnectorColor(connector: Connector) {
    if (connector.status === "Available") {
      return "limegreen";
    } else if (connector.status === "Preparing") {
      return "orange";
    } else {
      return "red";
    }
  }

}
