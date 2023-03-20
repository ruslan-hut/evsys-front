import {Connector} from "./connector";

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
  connectors: Connector[]
}
