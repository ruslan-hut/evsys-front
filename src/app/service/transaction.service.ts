import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {ErrorService} from "./error.service";
import {BehaviorSubject, catchError, Observable, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {Transaction} from "../models/transaction";
import {WebsocketService} from "./websocket.service";
import {WsMessage} from "../models/ws-message";
import {Chargepoint} from "../models/chargepoint";
import {AccountService} from "./account.service";

@Injectable({
  providedIn: 'root'
})
export class TransactionService  {

  private transactions: Transaction[] = [];
  private transactions$ = new BehaviorSubject<Transaction[]>([]);

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService,
    private accountService: AccountService,
  ) {
    this.accountService.authState$.subscribe(status =>{
      if (status) {
        this.init();
      }
    });
  }

  private init(): void {
    this.websocketService.receive().subscribe(message => {
      this.onWsMessage(message)
    });
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(environment.apiUrl + environment.transactionInfo + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message)
    return throwError(() => err.message)
  }

  private onWsMessage(message: WsMessage) {
    if (message.status == 'error') {
      if (message.info) {
        this.errorService.handle(message.info);
      }
      return;
    }

    if (message.status == 'value' && message.info == 'Wh') {
      const updated = message.id;
      const index = this.transactions.findIndex(transaction => transaction.transaction_id == updated);
      if (index !== -1 && updated) {
        let updatedTransaction: Transaction = this.transactions[index];
        updatedTransaction.meter_values.push(message.meter_value!!);
        updatedTransaction.consumed = message.power!!;
        updatedTransaction.price= message.price!!;
        updatedTransaction.status = message.connector_status!!;

        this.transactions[index] = updatedTransaction;
        this.transactions$.next(this.transactions);
      }
      else if (index === -1 && updated) {
        this.getTransaction(updated).subscribe(transaction => {
          this.transactions.push(transaction);
          this.transactions$.next(this.transactions);
        });
      }
    }
  }

  subscribeOnUpdates(transactionID: number, chargePointID: string, connectorID: number): void {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'ListenTransaction', transaction_id: transactionID, charge_point_id: chargePointID, connector_id: connectorID});
      }
    });
  }

}
