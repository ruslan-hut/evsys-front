export interface WsRequest {
  command: string,
  token?: string,
  charge_point_id?: string,
  connector_id?: number,
  transaction_id?: number,
}
