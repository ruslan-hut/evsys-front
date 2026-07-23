export interface MeterValue {
  transaction_id: number,
  connector_id: number,
  connector_status: string,
  value: number,
  power_rate: number,
  // Measured on the vehicle side of the charge point; absent on samples stored
  // before the backend recorded them.
  voltage?: number,
  current_import?: number,
  current_offered?: number,
  price: number,
  time: string,
  unit: string,
}
