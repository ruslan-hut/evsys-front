import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {Connector} from "../../models/connector";

import { MatCardContent, MatCardTitle } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-connector-form',
    templateUrl: './connector-form.component.html',
    styleUrls: ['./connector-form.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardContent, MatCardTitle, FormsModule]
})
export class ConnectorFormComponent {
  @Input() connectors: Connector[];

  getConnectorColor(connector: Connector) {
    if (connector.state === "available") {
      return "limegreen";
    } else if (connector.state === "occupied") {
      return "orange";
    } else {
      return "red";
    }
  }
}
