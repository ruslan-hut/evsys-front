export interface WsChannel {
  command: string;
  params?: {
    charge_point_id?: string;
    connector_id?: number;
    transaction_id?: number;
  };
}

/**
 * Generate unique key for subscription registry
 */
export function channelKey(channel: WsChannel): string {
  const base = channel.command;
  if (!channel.params) return base;
  const parts = [
    channel.params.charge_point_id,
    channel.params.connector_id?.toString(),
    channel.params.transaction_id?.toString()
  ].filter(p => p !== undefined);
  return parts.length > 0 ? `${base}:${parts.join(':')}` : base;
}

/**
 * Parse channel key back to WsChannel
 */
export function parseChannelKey(key: string): WsChannel {
  const [command, ...params] = key.split(':');
  if (params.length === 0) {
    return { command };
  }

  // Reconstruct params based on command type
  const channel: WsChannel = { command, params: {} };

  if (command === 'ListenTransaction') {
    // Format: ListenTransaction:charge_point_id:connector_id:transaction_id
    if (params[0]) channel.params!.charge_point_id = params[0];
    if (params[1]) channel.params!.connector_id = parseInt(params[1], 10);
    if (params[2]) channel.params!.transaction_id = parseInt(params[2], 10);
  } else if (command === 'ListenChargePoints' || command === 'ListenLog') {
    // These don't have params
  }

  return channel;
}
