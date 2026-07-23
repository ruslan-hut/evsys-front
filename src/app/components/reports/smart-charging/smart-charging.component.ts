import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import {Router} from '@angular/router';
import {Subject, forkJoin} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {MatCard, MatCardContent} from '@angular/material/card';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {TranslatePipe} from '@ngx-translate/core';

import {ChargepointService} from '../../../service/chargepoint.service';
import {TimeService} from '../../../service/time.service';
import {Chargepoint} from '../../../models/chargepoint';
import {Connector} from '../../../models/connector';
import {ChargingLocation} from '../../../models/charging-location';

// Where a charge point's power limits stand, derived from its connectors'
// stored verdicts. 'enforced' means every limit that was asked for was taken;
// 'not-enforced' means at least one was refused or never confirmed; 'no-limit'
// means nothing has been asked of it yet.
type ChargerState = 'enforced' | 'not-enforced' | 'no-limit';

interface ConnectorRow {
  name: string,
  expectedLimit: number,
  verdictStatus?: string,
  verdictLimit?: number,
  verdictTime?: string,
  state: ChargerState,
}

interface ChargerRow {
  chargePointId: string,
  title: string,
  model: string,
  firmware: string,
  locationId: string,
  isOnline: boolean,
  state: ChargerState,
  connectors: ConnectorRow[],
}

// Options for the location filter. ALL is the sentinel for "every location".
const ALL_LOCATIONS = '';

@Component({
  selector: 'app-smart-charging',
  templateUrl: './smart-charging.component.html',
  styleUrl: './smart-charging.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard, MatCardContent, MatProgressBar, MatFormField, MatLabel,
    MatSelect, MatOption, MatIcon, MatIconButton, MatTooltip, TranslatePipe
  ]
})
export class SmartChargingComponent implements OnInit, OnDestroy {
  private readonly chargePointService = inject(ChargepointService);
  readonly timeService = inject(TimeService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  readonly allLocations = ALL_LOCATIONS;
  loading = false;

  // Every smart-charging charge point, and the subset shown under the current
  // location filter.
  private allChargers: ChargerRow[] = [];
  chargers: ChargerRow[] = [];

  // Locations that actually have a smart-charging charge point, so the filter
  // never offers a site with nothing to show.
  locations: ChargingLocation[] = [];
  selectedLocation = ALL_LOCATIONS;

  // Roll-up over the filtered set.
  enforcedCount = 0;
  notEnforcedCount = 0;
  noLimitCount = 0;

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    // Charge points come from the live list; locations name the sites the
    // filter groups by. Both are needed before the view can render.
    forkJoin({
      chargePoints: this.chargePointService.getChargePoints(),
      locations: this.chargePointService.getLocations()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({chargePoints, locations}) => {
          this.build(chargePoints, locations ?? []);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private build(chargePoints: Chargepoint[], locations: ChargingLocation[]): void {
    this.allChargers = chargePoints
      .filter(cp => cp.smart_charging)
      .map(cp => this.toRow(cp))
      .sort((a, b) => a.chargePointId.localeCompare(b.chargePointId));

    // Only offer locations that have a smart-charging charge point behind them.
    const present = new Set(this.allChargers.map(c => c.locationId).filter(id => id !== ''));
    this.locations = locations
      .filter(loc => present.has(loc.id))
      .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

    // A charge point may reference a location the list did not return; keep it
    // reachable through a synthesised entry rather than hiding it.
    for (const id of present) {
      if (!this.locations.some(loc => loc.id === id)) {
        this.locations.push({id, name: id, address: '', city: '', power_limit: 0, default_power_limit: 0});
      }
    }

    // A filter pointing at a location that just disappeared falls back to All.
    if (this.selectedLocation !== ALL_LOCATIONS && !present.has(this.selectedLocation)) {
      this.selectedLocation = ALL_LOCATIONS;
    }
    this.applyFilter();
  }

  private toRow(cp: Chargepoint): ChargerRow {
    const connectors = (cp.connectors ?? []).map(c => this.toConnectorRow(c));
    return {
      chargePointId: cp.charge_point_id ?? '',
      title: cp.title || (cp.charge_point_id ?? ''),
      model: cp.model,
      firmware: cp.firmware_version,
      locationId: cp.location_id ?? '',
      isOnline: cp.is_online,
      state: this.rollUpState(connectors),
      connectors
    };
  }

  private toConnectorRow(connector: Connector): ConnectorRow {
    const verdict = connector.last_profile;
    return {
      name: connector.connector_id_name || connector.connector_id,
      expectedLimit: connector.current_power_limit,
      verdictStatus: verdict?.status,
      verdictLimit: verdict?.limit,
      verdictTime: verdict?.time,
      state: this.connectorState(connector)
    };
  }

  // A connector reads as enforced only when its stored verdict is Accepted; a
  // limit that was asked for (current_power_limit > 0) but never confirmed, or
  // refused, is not-enforced. Nothing asked at all is no-limit.
  private connectorState(connector: Connector): ChargerState {
    const status = connector.last_profile?.status;
    if (status === 'Accepted') return 'enforced';
    if (status) return 'not-enforced';
    return connector.current_power_limit > 0 ? 'not-enforced' : 'no-limit';
  }

  // A charge point is as weak as its weakest connector: one not-enforced limit
  // is worth surfacing even when the others are fine.
  private rollUpState(connectors: ConnectorRow[]): ChargerState {
    if (connectors.some(c => c.state === 'not-enforced')) return 'not-enforced';
    if (connectors.some(c => c.state === 'enforced')) return 'enforced';
    return 'no-limit';
  }

  onLocationChange(locationId: string): void {
    this.selectedLocation = locationId;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  private applyFilter(): void {
    this.chargers = this.selectedLocation === ALL_LOCATIONS
      ? this.allChargers
      : this.allChargers.filter(c => c.locationId === this.selectedLocation);

    this.enforcedCount = this.chargers.filter(c => c.state === 'enforced').length;
    this.notEnforcedCount = this.chargers.filter(c => c.state === 'not-enforced').length;
    this.noLimitCount = this.chargers.filter(c => c.state === 'no-limit').length;
  }

  stateIcon(state: ChargerState): string {
    switch (state) {
      case 'enforced': return 'check_circle';
      case 'not-enforced': return 'error';
      default: return 'remove_circle_outline';
    }
  }

  refresh(): void {
    this.loadData();
  }

  navigateToStation(chargePointId: string): void {
    this.router.navigate(['/points-info', {id: chargePointId}]);
  }
}
