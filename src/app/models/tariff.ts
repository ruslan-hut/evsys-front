
export interface Tariff {
  data: TariffData[];
  status_code: number;
  status_message: string;
  timestamp: string;
}

export interface TariffData {
  id: string;
  currency: string;
  elements: Element[];
  last_updated: string;
}

export interface Element {
  price_components: PriceComponent[];
}

export interface PriceComponent {
  type: string;
  price: number;
  step_size: number;
}
