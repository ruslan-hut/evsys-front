import { Injectable, inject } from "@angular/core";
import {catchError, Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {MonthStats} from "../models/month-stats";
import {UserStats} from "../models/user-stats";
import {Group} from "../models/group";
import {StationUptime} from "../models/station-uptime";
import {StationStatus} from "../models/station-status";

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly errorService = inject(ErrorService);

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-CA').format(date); // 'en-CA' produces 'YYYY-MM-DD' format
  }

  private formatDateTimeEndOfDay(date: Date): string {
    const formattedDate = this.formatDate(date);
    return `${formattedDate}T23:59:59`;
  }

  getGroups(): Group[] {
    return [
      {id: 'default', name: 'Client'},
      {id: 'office', name: 'Office'}
    ]
  }

  getMonthlyReport(from: Date, to: Date, group: string): Observable<MonthStats[]> {
    const formattedFrom = this.formatDate(from);
    const formattedTo = this.formatDateTimeEndOfDay(to);

    const params = new HttpParams()
      .set('from', formattedFrom)
      .set('to', formattedTo)
      .set('group', group);

    return this.http.get<MonthStats[]>(environment.apiUrl + environment.report + environment.monthReport,{ params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getUserReport(from: Date, to: Date, group: string): Observable<UserStats[]> {
    const formattedFrom = this.formatDate(from);
    const formattedTo = this.formatDateTimeEndOfDay(to);

    const params = new HttpParams()
      .set('from', formattedFrom)
      .set('to', formattedTo)
      .set('group', group);

    return this.http.get<UserStats[]>(environment.apiUrl + environment.report + environment.userReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getChargerReport(from: Date, to: Date, group: string): Observable<UserStats[]> {
    const formattedFrom = this.formatDate(from);
    const formattedTo = this.formatDateTimeEndOfDay(to);

    const params = new HttpParams()
      .set('from', formattedFrom)
      .set('to', formattedTo)
      .set('group', group);

    return this.http.get<UserStats[]>(environment.apiUrl + environment.report + environment.chargerReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getUptimeReport(from: Date, to: Date, chargePointId?: string): Observable<StationUptime[]> {
    const formattedFrom = this.formatDateRFC3339(from);
    const formattedTo = this.formatDateRFC3339EndOfDay(to);

    let params = new HttpParams()
      .set('from', formattedFrom)
      .set('to', formattedTo);

    if (chargePointId) {
      params = params.set('charge_point_id', chargePointId);
    }

    return this.http.get<StationUptime[]>(environment.apiUrl + environment.report + environment.uptimeReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getStatusReport(chargePointId?: string): Observable<StationStatus[]> {
    let params = new HttpParams();

    if (chargePointId) {
      params = params.set('charge_point_id', chargePointId);
    }

    return this.http.get<StationStatus[]>(environment.apiUrl + environment.report + environment.statusReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  private formatDateRFC3339(date: Date): string {
    return date.toISOString();
  }

  private formatDateRFC3339EndOfDay(date: Date): string {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.toISOString();
  }

}
