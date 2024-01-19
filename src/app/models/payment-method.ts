export interface PaymentMethod {
  description: string,
  identifier: string,
  card_brand: string,
  card_country: string,
  expiry_date: string,
  is_default: boolean,
  user_id: string,
  user_name: string,
  fail_count: number,
}
