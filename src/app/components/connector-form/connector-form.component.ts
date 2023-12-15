import { Component, Input } from '@angular/core';
import {Connector} from "../../models/connector";

@Component({
  selector: 'app-connector-form',
  templateUrl: './connector-form.component.html',
  styleUrls: ['./connector-form.component.css']
})
export class ConnectorFormComponent {
  @Input() connectors: Connector[]
}
