import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  constructor() {
  }

  getTimeDifference(date: string): string {
    const eventTime = new Date(date);
    const now = new Date();
    const differenceInSeconds = Math.floor((now.getTime() - eventTime.getTime()) / 1000);

    const days = Math.floor(differenceInSeconds / (3600 * 24));
    const hours = Math.floor((differenceInSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((differenceInSeconds % 3600) / 60);

    let result = '';
    if (days > 0) {
      result += `${days} d. `;
    }
    if (hours > 0) {
      result += `${hours} h. `;
    }
    if (minutes > 0) {
      result += `${minutes} min. `;
    }

    return result.length > 0 ? result : 'now';
  }
}
