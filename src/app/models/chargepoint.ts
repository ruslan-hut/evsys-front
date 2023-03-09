import {Connector} from "./connector";

export interface Chargepoint {
  id?: string,
  title: string,
  description: string,
  model: string,
  serialNumber: string,
  vendor: string,
  firmwareVersion: string,
  connectors: Connector[]
}
