import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {ErrorService} from "./error.service";
import {catchError, Observable, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {Transaction} from "../models/transaction";

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  constructor(
    private http: HttpClient,
    //private websocketService: WebsocketService,
    private errorService: ErrorService) {
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(environment.apiUrl + environment.transactionInfo + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

}
