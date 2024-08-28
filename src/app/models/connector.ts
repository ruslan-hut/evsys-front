export interface Connector {
  connector_id: string,
  connector_id_name: string,
  charge_point_id: string,
  type: string,
  status: string,
  status_time: string,
  state: string,
  info: string,
  vendor_id: string,
  error_code: string,
  power: number,
  current_transaction_id: number,
}

export function getConnectorName(connector: Connector): string {
  return connector.connector_id_name ? connector.connector_id_name : connector.connector_id;
}
