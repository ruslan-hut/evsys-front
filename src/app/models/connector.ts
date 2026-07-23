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
  current_power_limit: number,
  // What the charge point answered about the last limit installed here.
  // current_power_limit records what was asked for and is written before the
  // answer arrives, so on its own it cannot tell a limit in force from one that
  // was refused. Absent on connectors never sent a profile, and on every
  // connector written before the central system started recording the answer.
  last_profile?: ProfileVerdict,
}

export interface ProfileVerdict {
  // 'Accepted', 'Rejected', 'NotSupported', or the central system's own
  // 'NoResponse' / 'Unreadable' for answers that never arrived or made no sense.
  status: string,
  limit: number,
  stack_level: number,
  time: string,
}

export function getConnectorName(connector: Connector): string {
  return connector.connector_id_name ? connector.connector_id_name : connector.connector_id;
}
