export interface WebhookHealth {
  name: string;
  url?: string;
  is_enabled: boolean;
  configured: boolean;
  pending: number;
  delivered: number;
  failed: number;
  oldest_pending?: string;
  last_delivered?: string;
}

export interface WebhookDelivery {
  event_id: string;
  subscriber: string;
  type: string;
  sequence: number;
  status: string;
  attempts: number;
  next_attempt: string;
  last_error?: string;
  created_at: string;
}
