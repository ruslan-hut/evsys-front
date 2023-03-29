export interface Connector {
  connector_id: string,
  charge_point_id: string,
  is_enabled: boolean,
  status: string,
  info: string,
  error_code: string,
  vendor_id: string,
}
