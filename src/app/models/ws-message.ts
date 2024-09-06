import {MeterValue} from "./meter-value";

export interface WsMessage {
  status: string;
  stage?: string;
  info?: string;
  progress?: number;
  id?: number;
  data?: string;
  meter_value?: MeterValue;
  power?: number;
  price?: number;
  connector_status?: string;
  power_rate?: number;
  soc?: number;
}
