import {Component, Input} from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";
import { Router } from '@angular/router';

@Component({
  selector: 'app-chargepoint',
  templateUrl: './chargepoint.component.html',
  styleUrls: ['./chargepoint.component.css']
})
export class ChargepointComponent {
  @Input() chargepoint: Chargepoint

  details = false

  constructor(private router: Router) { }

  editChargePoint() {
    const chargepointId = this.chargepoint.charge_point_id;

    this.router.navigate(['points-form', { id: chargepointId }]);
  }
}
