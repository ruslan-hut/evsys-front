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
export class ChargepointComponent implements OnInit {
  @Input() chargepoint: Chargepoint

  isAdmin = false;
  details = false

  constructor(
    private router: Router,
    private accountService: AccountService,

    public timeService: TimeService
    ) { }

  editChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-form', { id: chargepointId }]);
  }

  infoChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-info', { id: chargepointId }]);
  }

  ngOnInit(): void {
    this.accountService.user.subscribe(user => {
      if (user) {
        this.isAdmin = user.role === environment.admin;
      } else {
        this.isAdmin = false;
      }
    });
  }

}
