import {Component, Input} from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";

@Component({
  selector: 'app-chargepoint',
  templateUrl: './chargepoint.component.html',
  styleUrls: ['./chargepoint.component.css']
})
export class ChargepointComponent {
  @Input() chargepoint: Chargepoint

  details = false

  editChargepoint() {

  }
}
