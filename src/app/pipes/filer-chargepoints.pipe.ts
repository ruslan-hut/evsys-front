import { Pipe, PipeTransform } from '@angular/core';
import {Chargepoint} from "../models/chargepoint";

@Pipe({
  name: 'filerChargepoints'
})
export class FilerChargepointsPipe implements PipeTransform {

  transform(chargepoints: Chargepoint[], filter: string): Chargepoint[] {
    return chargepoints.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()));
  }

}
