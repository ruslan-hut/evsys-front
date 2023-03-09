import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {Chargepoint} from "../models/chargepoint";
import {ErrorService} from "./error.service";

@Injectable({
  providedIn: 'root'
})
export class ChargepointService {
  constructor(
    private http: HttpClient,
    private errorService: ErrorService) {
  }

  getAll(): Observable<Chargepoint[]> {
    return this.http.get<Chargepoint[]>('https://fakestoreapi.com/products')
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  create(chargepoint: Chargepoint): Observable<Chargepoint> {
    return this.http.post<Chargepoint>('https://fakestoreapi.com/products', chargepoint)
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }
}
