import {Component, Input} from "@angular/core"
import {IChargepoint} from "../../models/chargepoint";

@Component({
  selector: 'app-chargepoint',
  templateUrl: './chargepoint.component.html'
})
export class ChargepointComponent {
  @Input() chargepoint: IChargepoint

  details = false
}
