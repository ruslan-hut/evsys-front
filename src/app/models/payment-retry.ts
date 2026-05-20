export interface PaymentRetryItem {
  transaction_id: number;
  attempt: number;
  max_attempts: number;
  next_retry_time: string;
  last_error: string;
  created_at: string;
  updated_at: string;
  charge_point_id?: string;
  username?: string;
  payment_amount?: number;
  time_start?: string;
}
