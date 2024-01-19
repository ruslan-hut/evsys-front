export interface PaymentPlan {
  plan_id: string,
  is_default: boolean,
  is_active: boolean,
  price_per_kwh: number,
  price_per_hour: number,
}
