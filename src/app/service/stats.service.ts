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
import {ExportData} from "../models/export-data";
import {PowerGroupBy, PowerStats} from "../models/power-stats";
import {SiteConcurrency} from "../models/site-concurrency";

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
      {id: 'default', name: 'groups.client'},
      {id: 'office', name: 'groups.office'}
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

  /**
   * Power statistics from the meter values of finished sessions.
   *
   * `group` is optional here, unlike the totals reports: omitting it reports
   * every session rather than defaulting to a group.
   */
  getPowerReport(from: Date, to: Date, groupBy: PowerGroupBy, chargePointId?: string, group?: string): Observable<PowerStats[]> {
    let params = new HttpParams()
      .set('from', this.formatDateRFC3339(from))
      .set('to', this.formatDateRFC3339EndOfDay(to))
      .set('group_by', groupBy);

    if (chargePointId) {
      params = params.set('charge_point_id', chargePointId);
    }
    if (group) {
      params = params.set('group', group);
    }

    return this.http.get<PowerStats[]>(environment.apiUrl + environment.report + environment.powerReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Site concurrency: when sessions overlapped at a location, the amperage the
   * load balancer assigned them, and the peak the site actually supplied.
   *
   * `minSessions` selects which segments are listed, not what is measured - the
   * summary figures cover every segment regardless. It defaults to 2 on the
   * server, which lists overlaps only; pass 1 for the whole timeline.
   */
  getConcurrencyReport(from: Date, to: Date, locationId?: string, minSessions?: number): Observable<SiteConcurrency[]> {
    let params = new HttpParams()
      .set('from', this.formatDateRFC3339StartOfDay(from))
      .set('to', this.formatDateRFC3339EndOfDay(to));

    if (locationId) {
      params = params.set('location_id', locationId);
    }
    if (minSessions) {
      params = params.set('min_sessions', minSessions);
    }

    return this.http.get<SiteConcurrency[]>(environment.apiUrl + environment.report + environment.concurrencyReport, { params })
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

  getExportReport(from: Date, to: Date, group: string): Observable<ExportData[]> {
    const formattedFrom = this.formatDate(from);
    const formattedTo = this.formatDateTimeEndOfDay(to);

    const params = new HttpParams()
      .set('from', formattedFrom)
      .set('to', formattedTo)
      .set('group', group);

    return this.http.get<ExportData[]>(environment.apiUrl + environment.report + environment.exportReport, { params })
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  private formatDateRFC3339(date: Date): string {
    return date.toISOString();
  }

  /**
   * The range pickers hand back dates carrying the current time of day, so a
   * range shown as "22 Aug - 28 Aug" would otherwise start at 22 Aug 18:40 and
   * silently drop that morning's sessions. The end is already widened to the
   * end of its day; this widens the start to match, so a displayed date range
   * means the whole of those days.
   */
  private formatDateRFC3339StartOfDay(date: Date): string {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay.toISOString();
  }

  private formatDateRFC3339EndOfDay(date: Date): string {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.toISOString();
  }

}
