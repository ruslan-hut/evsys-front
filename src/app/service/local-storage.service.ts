import {Injectable} from "@angular/core";
import {RedirectUrl} from "../models/redirect-url";

@Injectable({
  providedIn: 'root'
})

export class LocalStorageService {
  private readonly ALWAYS_LOAD_ALL_CHARGERS_KEY = 'alwaysLoadAllChargers';
  private readonly START_PAGE_KEY = 'startPage';

  getAlwaysLoadAllChargers(): boolean {
    return localStorage.getItem(this.ALWAYS_LOAD_ALL_CHARGERS_KEY) === 'true';
  }

  setAlwaysLoadAllChargers(value: boolean): void {
    localStorage.setItem(this.ALWAYS_LOAD_ALL_CHARGERS_KEY, String(value));
  }

  getStartPage(): string | null {
    return localStorage.getItem(this.START_PAGE_KEY);
  }

  setStartPage(value: string): void {
    localStorage.setItem(this.START_PAGE_KEY, value);
  }

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
