export type MailSubscriptionPeriod = 'daily' | 'weekly' | 'monthly';
/** statistic: consumption figures of one group; ai_analysis: the weekly AI review of the whole network. */
export type MailReportType = 'statistic' | 'ai_analysis';
export type MailLanguage = 'es' | 'en';

export interface MailSubscription {
  id?: string;
  email: string;
  report: MailReportType;
  /** Statistic reports only; empty for the AI analysis. */
  period: MailSubscriptionPeriod | '';
  /** Statistic reports only; empty for the AI analysis. */
  user_group: string;
  language: MailLanguage;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

/** One address with all the reports it receives. */
export interface MailRecipient {
  email: string;
  subscriptions: MailSubscription[];
  enabled: number;
}
