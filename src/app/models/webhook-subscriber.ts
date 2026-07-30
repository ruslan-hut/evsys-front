export interface WebhookSubscriber {
  id?: string;
  name: string;
  url: string;
  token: string;
  events: string[];
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}
