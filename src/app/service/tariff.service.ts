import {Injectable} from "@angular/core";
import {Tariff} from "../models/tariff";

@Injectable({
  providedIn: 'root'
})
export class TariffService {

  constructor() {
  }

  getTariff(): Tariff {
    return {
      data: [
        {
          id: '1',
          currency: 'EUR',
          elements: [
            {
              price_components: [
                {
                  type: 'ENERGY',
                  price: 0.29,
                  step_size: 1
                }
              ]
            }
          ],
          last_updated: '2024-09-01T00:00:00Z'
        }
      ],
      status_code: 1000,
      status_message: 'Success',
      timestamp: '2024-12-23T11:46:16Z'
    }
  }
}
