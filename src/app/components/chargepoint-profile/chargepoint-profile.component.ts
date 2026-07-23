import {
  Component, Input, OnChanges, ChangeDetectionStrategy, ChangeDetectorRef, inject
} from '@angular/core';
import {
  MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
  MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow
} from '@angular/material/table';
import {MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions} from '@angular/material/card';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {Chargepoint} from '../../models/chargepoint';
import {getConnectorName} from '../../models/connector';
import {ConfigKey, CsConfigResponse} from '../../models/cs-config-response';
import {ConnectorProfile, CsCompositeSchedule, ProfileAgreement} from '../../models/cs-composite-schedule';
import {ChargepointService} from '../../service/chargepoint.service';
import {TimeService} from '../../service/time.service';

// The keys that decide whether a charging profile can be enforced at all: a
// stack level below the one the central system asks for, or a charge point that
// accepts only watt schedules, makes every amperage limit a no-op.
const SMART_CHARGING_KEYS = [
  'ChargeProfileMaxStackLevel',
  'ChargingScheduleAllowedChargingRateUnit',
  'MaxChargingProfilesInstalled',
  'ChargingScheduleMaxPeriods',
];

// One hour: long enough to cover a session, short enough that a charge point
// answers with a handful of periods rather than a day of them.
const SCHEDULE_DURATION = 3600;

@Component({
  selector: 'app-chargepoint-profile',
  templateUrl: './chargepoint-profile.component.html',
  styleUrls: ['./chargepoint-profile.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions,
    MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell,
    MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow,
    MatProgressSpinner, MatButton, MatIcon, TranslatePipe
  ]
})
export class ChargepointProfileComponent implements OnChanges {
  private readonly chargePointService = inject(ChargepointService);
  private readonly translate = inject(TranslateService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly timeService = inject(TimeService);

  @Input({required: true}) chargePoint!: Chargepoint;

  connectorProfiles: ConnectorProfile[] = [];
  profileColumns: string[] = ['connector', 'expected', 'recorded', 'reported', 'agreement'];
  smartChargingConfig: ConfigKey[] = [];
  loadingConfig = false;

  ngOnChanges(): void {
    this.resetConnectorProfiles();
  }

  // Seeds a row per connector from data already on the charge point document:
  // what the central system asked for, and what the charge point answered at the
  // time. The charge point's *current* view stays empty until it is asked - this
  // page is opened to check status, and firing OCPP commands on every visit
  // would make it slow for exactly the offline charge points most worth looking
  // at.
  private resetConnectorProfiles(): void {
    this.smartChargingConfig = [];
    this.connectorProfiles = (this.chargePoint?.connectors ?? []).map(connector => ({
      connectorId: Number(connector.connector_id),
      connectorName: getConnectorName(connector),
      status: connector.status,
      transactionId: connector.current_transaction_id,
      expectedLimit: connector.current_power_limit,
      lastProfile: connector.last_profile,
      agreement: 'unknown' as ProfileAgreement,
      loading: false
    }));
  }

  // The stored verdict answers "did this limit land" without asking the charge
  // point anything. It is deliberately not folded into the live agreement: a
  // profile accepted an hour ago may since have been cleared by a reboot, so
  // saying so would overstate what is known.
  recordedState(profile: ConnectorProfile): ProfileAgreement {
    const status = profile.lastProfile?.status;
    if (!status) return 'unknown';
    return status === 'Accepted' ? 'match' : 'not-enforced';
  }

  get canRead(): boolean {
    return this.chargePoint?.is_online === true && this.connectorProfiles.length > 0;
  }

  readAll(): void {
    this.readSmartChargingConfig();
    this.connectorProfiles.forEach(profile => this.readProfile(profile));
  }

  // Asks for the four keys in one round trip rather than one call per key.
  private readSmartChargingConfig(): void {
    const chargePointId = this.chargePoint?.charge_point_id;
    if (chargePointId == null || this.loadingConfig) return;

    this.loadingConfig = true;
    this.cdr.markForCheck();

    this.chargePointService.sendCsCommand(chargePointId, 0, 'GetConfiguration', SMART_CHARGING_KEYS.join(','))
      .subscribe({
        next: (response) => {
          try {
            const config = JSON.parse(response.info) as CsConfigResponse;
            this.smartChargingConfig = config.configurationKey ?? [];
          } catch {
            this.smartChargingConfig = [];
          }
          this.loadingConfig = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.smartChargingConfig = [];
          this.loadingConfig = false;
          this.cdr.markForCheck();
        }
      });
  }

  // An accepted SetChargingProfile only says the profile was stored. Asking the
  // charge point to resolve every profile it holds is the one statement it makes
  // about the limit it is actually enforcing, so it is what the central system's
  // figure has to be checked against.
  readProfile(profile: ConnectorProfile): void {
    const chargePointId = this.chargePoint?.charge_point_id;
    if (chargePointId == null || profile.loading) return;

    profile.loading = true;
    profile.error = undefined;
    this.cdr.markForCheck();

    // The unit is pinned: a schedule returned in watts cannot be compared
    // against an amperage limit without knowing the voltage.
    const payload = JSON.stringify({duration: SCHEDULE_DURATION, chargingRateUnit: 'A'});
    this.chargePointService.sendCsCommand(chargePointId, profile.connectorId, 'GetCompositeSchedule', payload)
      .subscribe({
        next: (response) => {
          this.applySchedule(profile, response.status, response.info);
          profile.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          profile.error = this.translate.instant('chargepointProfile.readFailed');
          profile.agreement = 'unknown';
          profile.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private applySchedule(profile: ConnectorProfile, status: string, info: string): void {
    profile.reportedLimit = undefined;
    profile.reportedUnit = undefined;

    let schedule: CsCompositeSchedule;
    try {
      schedule = JSON.parse(info) as CsCompositeSchedule;
    } catch {
      profile.error = info || this.translate.instant('chargepointProfile.readFailed');
      profile.agreement = 'unknown';
      return;
    }

    const period = schedule.chargingSchedule?.chargingSchedulePeriod?.[0];
    if (status !== 'success' || schedule.status !== 'Accepted' || !period) {
      // The charge point answered and reported no schedule at all. If the
      // central system thinks it installed a limit, that limit is not in force.
      profile.agreement = profile.expectedLimit > 0 ? 'not-enforced' : 'unknown';
      if (schedule.status && schedule.status !== 'Accepted') {
        profile.error = schedule.status;
      }
      return;
    }

    profile.reportedLimit = period.limit;
    profile.reportedUnit = schedule.chargingSchedule?.chargingRateUnit;
    profile.agreement = this.compareLimits(profile);
  }

  private compareLimits(profile: ConnectorProfile): ProfileAgreement {
    if (profile.expectedLimit <= 0 || profile.reportedLimit === undefined) return 'unknown';
    // Only amperes are comparable; converting a watt schedule needs the pack
    // voltage, and claiming a match without it would be a guess.
    if (profile.reportedUnit !== 'A') return 'unknown';
    return Math.abs(profile.reportedLimit - profile.expectedLimit) < 0.5 ? 'match' : 'mismatch';
  }

  agreementIcon(agreement: ProfileAgreement): string {
    switch (agreement) {
      case 'match': return 'check_circle';
      case 'mismatch': return 'error';
      case 'not-enforced': return 'report_problem';
      default: return 'help_outline';
    }
  }
}
