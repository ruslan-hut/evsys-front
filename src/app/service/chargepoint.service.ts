import {Injectable} from "@angular/core";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {IChargepoint} from "../models/chargepoint";
import {ErrorService} from "./error.service";

@Injectable({
  providedIn: 'root'
})
export class ChargepointService {
  constructor(
    private http: HttpClient,
    private errorService: ErrorService) {
  }

  getAll(): Observable<IChargepoint[]> {
    return this.http.get<IChargepoint[]>('https://fakestoreapi.com/products')
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  create(chargepoint: IChargepoint): Observable<IChargepoint> {
    return this.http.post<IChargepoint>('https://fakestoreapi.com/products', chargepoint)
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }
}
