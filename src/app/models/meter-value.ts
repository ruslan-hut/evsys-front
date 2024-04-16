export interface MeterValue {
  transaction_id: number,
  connector_id: number,
  connector_status: string,
  value: number,
  power_rate: number,
  price: number,
  time: string,
  unit: string,
}
