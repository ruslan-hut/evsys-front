import {Connector} from "./connector";
import {Location} from "./location";
export interface Chargepoint {
  charge_point_id?: string,
  is_enabled: boolean,
  title: string,
  description: string,
  model: string,
  serial_number: string,
  vendor: string,
  firmware_version: string,
  status: string,
  error_code: string,
  info: string,
  last_seen: string,
  event_time: string,
  is_online: boolean,
  status_time: string,
  address: string,
  access_type: string,
  access_level: number,
  location: Location,
  connectors: Connector[],
  // Controls whether the central system triggers MeterValues during a
  // transaction. Optional: omitting it on save leaves the stored value alone.
  trigger_message?: boolean
}
