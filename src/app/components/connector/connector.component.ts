import { Component, ChangeDetectionStrategy, inject, input } from "@angular/core"
import {Connector} from "../../models/connector";
import {Router} from "@angular/router";
import { DecimalPipe, TitleCasePipe } from "@angular/common";

@Component({
    selector: 'app-connector',
    templateUrl: './connector.component.html',
    styleUrls: ['./connector.component.css'],
    imports: [DecimalPipe, TitleCasePipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectorComponent {
  private readonly router = inject(Router);

  readonly connector = input.required<Connector>();

  getConnectorStatusClass(): string {
    const connector = this.connector();
    if (connector.state === "available") {
      return "connector-available";
    } else if (connector.state === "occupied") {
      return "connector-occupied";
    } else if (connector.current_transaction_id > -1) {
      return "connector-charging";
    } else {
      return "connector-error";
    }
  }

  /** A session is running here, so the slot animates to show energy moving. */
  isCharging(): boolean {
    return this.connector().current_transaction_id > -1;
  }

  isDisabled() {
    return this.connector().status.toLowerCase() === "unavailable";
  }

  getConnectorName(): string {
    const connector = this.connector();
    if(connector.connector_id_name!="") {
      return connector.connector_id_name;
    } else {
      return connector.connector_id;
    }
  }

  /** The slot shows abbreviated values, so the label carries the full reading. */
  ariaLabel(): string {
    const connector = this.connector();
    const parts = [
      `Connector ${this.getConnectorName()}`,
      connector.type,
      `${connector.power} kW`,
      `status ${connector.status}`
    ];
    if (connector.current_power_limit > 0) {
      parts.push(`limited to ${connector.current_power_limit} kW`);
    }
    return parts.join(', ');
  }

  /**
   * The ev_plug_type1/type2 asset names are swapped relative to their contents:
   * ev_plug_type1.svg draws the Type 2 socket. The mapping below is correct as
   * written and renders the right graphic — do not "fix" it to match the file
   * names without re-drawing the assets.
   */
  getConnectorTypeIcon(): string {
   switch (this.connector().type) {
      case "Type 2":
        return "assets/icons/ev_plug_type1.svg";
      case "Type 1":
        return "assets/icons/ev_plug_type2.svg";
      case "CHAdeMO":
        return "assets/icons/ev_plug_chademo.svg";
      case "CCS1":
        return "assets/icons/ev_plug_ccs1.svg";
      case "CCS2":
        return "assets/icons/ev_plug_ccs2.svg";
      default:
        return "assets/icons/power.svg";
   }
  }

  openInfo() {
    this.router.navigate(['new-transactions'], {
      queryParams: { charge_point_id: this.connector().charge_point_id, connector_id: this.connector().connector_id }
    }).then(_ => {});
  }
}
