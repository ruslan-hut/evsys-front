import {Injectable} from "@angular/core";
import {catchError, Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {ErrorService} from "./error.service";
import {environment} from "../../environments/environment";
import {MonthStats} from "../models/month-stats";
import {UserStats} from "../models/user-stats";
import {Group} from "../models/group";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
  ) {
  }

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
    const formattedTo = this.formatDate(to);

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


}
