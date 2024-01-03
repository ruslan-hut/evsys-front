import { Component, Input } from '@angular/core';
import {Connector} from "../../models/connector";

@Component({
  selector: 'app-connector-form',
  templateUrl: './connector-form.component.html',
  styleUrls: ['./connector-form.component.css']
})
export class ConnectorFormComponent {
  @Input() connectors: Connector[]

  getConnectorColor(connector: Connector) {
    if (connector.status === "Available") {
      return "limegreen";
    } else if (connector.status === "Preparing") {
      return "orange";
    } else {
      return "red";
    }
  }

  getConnectorName(connector: Connector): string {
    if(connector.connector_id_name!="") {
      return connector.connector_id_name;
    } else {
      return connector.connector_id;
    }
  }
}
