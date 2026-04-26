export type MailSubscriptionPeriod = 'daily' | 'weekly' | 'monthly';

export interface MailSubscription {
  id?: string;
  email: string;
  period: MailSubscriptionPeriod;
  user_group: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}
