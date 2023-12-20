export interface Connector {
  connector_id: string,
  charge_point_id: string,
  type: string,
  status: string,
  status_time: string,
  info: string,
  error_code: string,
  power: number,
  current_transaction_id: number,
}
