import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import {Connector} from "../../models/connector";

import { MatCardContent, MatCardTitle } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-connector-form',
    templateUrl: './connector-form.component.html',
    styleUrls: ['./connector-form.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardContent, MatCardTitle, FormsModule, TranslatePipe]
})
export class ConnectorFormComponent {
  readonly connectors = input<Connector[]>();

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
