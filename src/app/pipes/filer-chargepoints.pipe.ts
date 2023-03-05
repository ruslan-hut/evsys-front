import { Pipe, PipeTransform } from '@angular/core';
import {IChargepoint} from "../models/chargepoint";

@Pipe({
  name: 'filerChargepoints'
})
export class FilerChargepointsPipe implements PipeTransform {

  transform(chargepoints: IChargepoint[], filter: string): IChargepoint[] {
    return chargepoints.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()));
  }

}
