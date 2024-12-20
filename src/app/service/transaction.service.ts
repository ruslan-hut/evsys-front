import {Injectable} from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {ErrorService} from "./error.service";
import {BehaviorSubject, catchError, Observable, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {Transaction} from "../models/transaction";
import {WebsocketService} from "./websocket.service";
import {WsMessage} from "../models/ws-message";
import {AccountService} from "./account.service";

@Injectable({
  providedIn: 'root'
})
export class TransactionService  {

  private transactions: Transaction[] = [];
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  public isWaiting = false;
  public isStarted = false;
  public transactionId = new BehaviorSubject<number>(-1);

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService,
    private accountService: AccountService,
  ) {
    this.accountService.user$.subscribe(user =>{
      if (user) {
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
    this.transactionId = new BehaviorSubject<number>(id);
    return this.http.get<Transaction>(environment.apiUrl + environment.transactionInfo + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      )
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  startTransaction(chargePointId: string, connectorId:number) {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'StartTransaction', charge_point_id: chargePointId, connector_id: connectorId});
      }
    });
  }

  stopTransaction(chargePointId: string, connectorId:number, transactionID: number) {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'StopTransaction', charge_point_id: chargePointId, connector_id: connectorId, transaction_id: transactionID});
      }
    });
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


    switch (message.status) {
      case 'value':
        this.isWaiting = false;
        this.updateTransaction(message);
        break;
      case 'waiting':
        if(message.stage == 'start' || message.stage == 'stop') {
          this.isWaiting = true;
        }
        break;
      case 'success':
        if(message.stage == 'start' || message.stage == 'stop') {
          this.isWaiting = false;
          this.isStarted = message.stage == 'start';
          if(this.isStarted) {
            this.transactionId.next(message.id!!);
          }else {
            this.transactionId.next(-1);
          }
        }
        break;
      case 'error':
        this.isWaiting = false;
        this.errorService.handle(message.info!!);
        break;
    }
  }

  private updateTransaction(message: WsMessage) {
    const updated = message.id;
    const index = this.transactions.findIndex(transaction => transaction.transaction_id == updated);
    if (index !== -1 && updated) {
      let updatedTransaction: Transaction = this.transactions[index];
      updatedTransaction.meter_values.push(message.meter_value!!);
      updatedTransaction.power_rate = message.power_rate!!;
      updatedTransaction.consumed = message.power!!;
      updatedTransaction.price= message.price!!;
      updatedTransaction.status = message.connector_status!!;
      updatedTransaction.battery = message.soc!!;

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

  subscribeOnUpdates(transactionID: number, chargePointID: string, connectorID: number): void {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'ListenTransaction', transaction_id: transactionID, charge_point_id: chargePointID, connector_id: connectorID});
      }
    });
  }

  unsubscribeFromUpdates(transactionID: number, chargePointID: string, connectorID: number): void {
    this.websocketService.isConnected$.subscribe(status =>{
      if (status) {
        this.websocketService.send({command: 'StopListenTransaction', transaction_id: transactionID, charge_point_id: chargePointID, connector_id: connectorID});
        this.transactionId.next(-1);
      }
    });
  }

}
