import {ProfileVerdict} from './connector';

// Response to GetCompositeSchedule: the charge point's own resolution of every
// charging profile installed on a connector. It is the only statement the
// charge point makes about the limit it is actually enforcing, so it is what a
// central-system limit has to be compared against - an accepted SetChargingProfile
// only says the profile was stored, not that it won.
export interface CsCompositeSchedule {
  status: 'Accepted' | 'Rejected' | string,
  connectorId?: number,
  scheduleStart?: string,
  chargingSchedule?: CsChargingSchedule,
}

export interface CsChargingSchedule {
  duration?: number,
  startSchedule?: string,
  // 'A' or 'W'. A charge point that answers in watts cannot be compared against
  // an amperage limit without knowing the voltage.
  chargingRateUnit: string,
  chargingSchedulePeriod: CsChargingSchedulePeriod[],
  minChargingRate?: number,
}

export interface CsChargingSchedulePeriod {
  startPeriod: number,
  limit: number,
  numberPhases?: number,
}

// How the charge point's answer compares with the limit the central system
// believes it set. 'unknown' covers a connector with no limit recorded and a
// charge point that did not report one.
export type ProfileAgreement = 'match' | 'mismatch' | 'not-enforced' | 'unknown';

export interface ConnectorProfile {
  connectorId: number,
  connectorName: string,
  status: string,
  transactionId: number,
  // what the central system asked for when it installed the limit
  expectedLimit: number,
  // what the charge point answered at that moment, stored on the connector.
  // Available without asking the charge point anything.
  lastProfile?: ProfileVerdict,
  // what the charge point reports it is enforcing right now; only filled in
  // once an operator asks for it
  reportedLimit?: number,
  reportedUnit?: string,
  agreement: ProfileAgreement,
  loading: boolean,
  error?: string,
}
