import {Injectable} from "@angular/core";
import {Chargepoint} from "../models/chargepoint";
import {BehaviorSubject} from "rxjs";
import {RedirectUrl} from "../models/redirect-url";

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService {

  saveRedirectUrl(charge_point_id: string, connector_id:number): void {
    const redirectUrl : RedirectUrl = {
      charge_point_id: charge_point_id,
      connector_id: connector_id,
      time: Date.now()
    }

    localStorage.setItem('redirectUrl', JSON.stringify(redirectUrl));
  }

  getRedirectUrl(): RedirectUrl | null {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      localStorage.removeItem('redirectUrl');
      return JSON.parse(redirectUrl);
    }
    return null;
  }
}
