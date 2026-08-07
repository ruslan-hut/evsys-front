import { Component, ChangeDetectionStrategy, DestroyRef, effect, inject, input, signal } from "@angular/core"
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

  /** True briefly after a WebSocket update changes this charge point's state. */
  readonly stateChanged = signal(false);

  private lastStateKey: string | null = null;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    effect(() => {
      const key = this.stateKey(this.chargepoint());
      const previous = this.lastStateKey;
      this.lastStateKey = key;

      // Skip the first pass: an initial render is not a change.
      if (previous === null || previous === key) {
        return;
      }

      this.stateChanged.set(true);
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(() => this.stateChanged.set(false), 1200);
    });

    destroyRef.onDestroy(() => {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
    });
  }

  /** Everything that should visibly flag a change when it moves. */
  private stateKey(chargepoint: Chargepoint): string {
    const connectors = (chargepoint.connectors || [])
      .map(c => `${c.connector_id}:${c.status}:${c.state}:${c.current_transaction_id}`)
      .join('|');
    return `${chargepoint.is_online}:${chargepoint.status}:${connectors}`;
  }

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
