import {Connector} from "./connector";

export interface Transaction{
  transaction_id: number,
  connector_id: number,
  connector: Connector,
  charge_point_id: string,
  charge_point_title: string,
  charge_point_address: string,
  time_started: string,
  meter_start: number,
  duration: number,
  consumed: number,
  price: number,
  status: string,
  is_charging: boolean,
  can_stop: boolean,
}
