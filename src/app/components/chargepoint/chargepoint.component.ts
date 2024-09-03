import {Component, Input, OnInit} from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";
import { Router } from '@angular/router';
import {AccountService} from "../../service/account.service";
import {environment} from "../../../environments/environment";
import {TimeService} from "../../service/time.service";
import {Connector} from "../../models/connector";

@Component({
  selector: 'app-chargepoint',
  templateUrl: './chargepoint.component.html',
  styleUrls: ['./chargepoint.component.css']
})
export class ChargepointComponent{
  @Input() chargepoint: Chargepoint

  constructor(
    private router: Router,
    public accountService: AccountService,

    public timeService: TimeService
    ) { }

  configureChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-config', { id: chargepointId }]);
  }

  editChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-form', { id: chargepointId }]);
  }

  infoChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-info', { id: chargepointId }]);
  }

}
