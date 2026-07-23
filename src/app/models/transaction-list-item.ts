import {UserTag} from './user-tag';
import {PaymentMethod} from './payment-method';
import {Connector} from './connector';

export interface TransactionMeterValue {
  transaction_id?: number;
  value: number;
  power_rate: number;
  // power_rate expressed in kW; power_active is what the charger reported,
  // where power_rate may be derived from consecutive meter readings.
  power_rate_wh?: number;
  power_active?: number;
  // Measured on the vehicle side of the charge point. current_offered is the
  // limit the charger advertises to the car, so comparing it against the
  // session's power_limit shows whether the load balancer's limit landed, and
  // against current_import whether the car drew what it was offered. Absent on
  // samples stored before the backend recorded them.
  voltage?: number;
  current_import?: number;
  current_offered?: number;
  battery_level?: number;
  consumed_energy?: number;
  price: number;
  time?: string;
  timestamp?: string;
  minute?: number;
  unit?: string;
  measurand?: string;
  connector_id?: number;
  connector_status?: string;
}

export interface PaymentPlan {
  plan_id: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  price_per_kwh: number;
  price_per_hour: number;
  start_time?: string;
  end_time?: string;
}

export interface Tariff {
  tariff_id: string;
  description: string;
}

export interface PaymentOrder {
  transaction_id: number;
  order: number;
  user_id: string;
  user_name: string;
  amount: number;
  currency: string;
  description: string;
  identifier: string;
  is_completed: boolean;
  result: string;
  date: string;
  time_opened: string;
  time_closed: string;
  refund_amount?: number;
  refund_time?: string;
}

export interface TransactionListItem {
  transaction_id: number;
  session_id?: string;
  is_finished?: boolean;
  connector_id: number;
  connector?: Connector;
  charge_point_id: string;
  charge_point_title?: string;
  charge_point_address?: string;
  id_tag?: string;
  reservation_id?: string;
  meter_start: number;
  meter_stop?: number;
  time_start?: string;
  time_started?: string;
  time_stop?: string;
  duration?: number;
  consumed?: number;
  power_rate?: number;
  price?: number;
  status?: string;
  is_charging?: boolean;
  can_stop?: boolean;
  reason?: string;
  id_tag_note?: string;
  username?: string;
  payment_amount?: number;
  payment_billed?: number;
  payment_order?: number;
  payment_error?: string;
  plan?: PaymentPlan;
  payment_plan?: PaymentPlan;
  tariff?: Tariff;
  meter_values?: TransactionMeterValue[];
  payment_method?: PaymentMethod;
  payment_orders?: PaymentOrder[];
  user_tag?: UserTag;
  protocol_version?: string;
  evse_id?: number;
  metadata?: Record<string, unknown>;
}

export function calculateConsumed(transaction: TransactionListItem): number {
  if (transaction.consumed !== undefined) {
    return transaction.consumed;
  }
  return (transaction.meter_stop || 0) - transaction.meter_start;
}
