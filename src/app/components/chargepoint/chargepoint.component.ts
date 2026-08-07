import { Component, ChangeDetectionStrategy, inject, input } from "@angular/core"
import {Chargepoint} from "../../models/chargepoint";
import { Router } from '@angular/router';
import {AccountService} from "../../service/account.service";
import {TimeService} from "../../service/time.service";
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { ConnectorComponent } from "../connector/connector.component";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { SortConnectorsPipe } from "../pipes/sortConnectorsPipe";

@Component({
    selector: 'app-chargepoint',
    templateUrl: './chargepoint.component.html',
    styleUrls: ['./chargepoint.component.css'],
    imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, ConnectorComponent, MatCardActions, MatIconButton, MatIcon, SortConnectorsPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChargepointComponent {
  private readonly router = inject(Router);
  readonly accountService = inject(AccountService);
  readonly timeService = inject(TimeService);

  readonly chargepoint = input.required<Chargepoint>();

  /**
   * Returns the status indicator color:
   * - 'green': online and all connectors available
   * - 'yellow': online but some connectors unavailable/occupied
   * - 'red': offline
   */
  getStatusColor(): 'green' | 'yellow' | 'red' {
    const chargepoint = this.chargepoint();
    if (!chargepoint.is_online) {
      return 'red';
    }

    const connectors = chargepoint.connectors || [];
    const allAvailable = connectors.every(c =>
      c.status?.toLowerCase() === 'available'
    );

    return allAvailable ? 'green' : 'yellow';
  }

  getStatusLabel(): string {
    const color = this.getStatusColor();
    if (color === 'red') return 'Offline';
    if (color === 'yellow') return 'Online, some connectors busy';
    return 'Online, all connectors available';
  }

  configureChargePoint() {
    const chargepointId = this.chargepoint().charge_point_id;

    this.router.navigate(['points-config', { id: chargepointId }]);
  }

  editChargePoint() {
    const chargepointId = this.chargepoint().charge_point_id;

    this.router.navigate(['points-form', { id: chargepointId }]);
  }

  infoChargePoint() {
    const chargepointId = this.chargepoint().charge_point_id;

    this.router.navigate(['points-info', { id: chargepointId }]);
  }

}
