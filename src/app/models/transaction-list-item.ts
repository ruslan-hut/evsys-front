import {UserTag} from './user-tag';

export interface TransactionMeterValue {
  timestamp: string;
  value: number;
  power_rate: number;
  price: number;
}

export interface PaymentPlan {
  plan_id: string;
  is_default: boolean;
  is_active: boolean;
  price_per_kwh: number;
  price_per_hour: number;
}

export interface TransactionListItem {
  transaction_id: number;
  is_finished: boolean;
  connector_id: number;
  charge_point_id: string;
  id_tag: string;
  reservation_id: string;
  meter_start: number;
  meter_stop: number;
  time_start: string;
  time_stop: string;
  payment_amount: number;
  payment_billed: number;
  payment_order: number;
  payment_error: string;
  plan?: PaymentPlan;
  meter_values?: TransactionMeterValue[];
  user_tag?: UserTag;
}

export function calculateConsumed(transaction: TransactionListItem): number {
  return transaction.meter_stop - transaction.meter_start;
}
