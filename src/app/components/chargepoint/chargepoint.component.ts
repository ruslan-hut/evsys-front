import {Component, Input} from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";

@Component({
  selector: 'app-chargepoint',
  templateUrl: './chargepoint.component.html'
})
export class ChargepointComponent {
  @Input() chargepoint: Chargepoint

  details = false
}
