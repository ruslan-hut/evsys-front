import {Component, Input, OnInit} from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";
import { Router } from '@angular/router';
import {AccountService} from "../../service/account.service";
import {environment} from "../../../environments/environment";

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
    ) { }

  editChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-form', { id: chargepointId }]);
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

  getTimeDifference(): string {
    const now = new Date();
    const event = new Date(this.chargepoint.event_time);
    const differenceInSeconds = Math.floor((now.getTime() - event.getTime()) / 1000);

    const hours = Math.floor(differenceInSeconds / 3600);
    const minutes = Math.floor((differenceInSeconds % 3600) / 60);

    return `${hours} h. ${minutes} min. ago`;
  }
}
