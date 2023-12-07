import {Component, Input} from "@angular/core"
import {Connector} from "../../models/connector";

@Component({
  selector: 'app-connector',
  templateUrl: './connector.component.html',
  styleUrls: ['./connector.component.css']
})
export class ConnectorComponent {
  @Input() connector: Connector

  details = false

  getConnectorColor() {
    if (this.connector.status === "Available") {
      return "limegreen";
    } else if (this.connector.status === "Reserved") {
      return "orange";
    } else {
      return "red";
    }
  }
}
