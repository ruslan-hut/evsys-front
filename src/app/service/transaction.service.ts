import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ErrorService } from './error.service';
import { BehaviorSubject, catchError, Observable, Subject, Subscription, throwError } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Transaction } from '../models/transaction';
import { TransactionListItem } from '../models/transaction-list-item';
import { TransactionFilter } from '../models/transaction-filter';
import { WebsocketService } from './websocket.service';
import { WsMessage } from '../models/ws-message';
import { AccountService } from './account.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService implements OnDestroy {
  private transactions: Transaction[] = [];
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  public isWaiting = false;
  public isStarted = false;
  public transactionId = new BehaviorSubject<number>(-1);

  private destroy$ = new Subject<void>();
  private globalMessageSubscription: Subscription | null = null;
  private activeSubscriptions = new Map<string, Subscription>();
  private isInitialized = false;

  constructor(
    private http: HttpClient,
    private websocketService: WebsocketService,
    private errorService: ErrorService,
    private accountService: AccountService,
  ) {
    // Initialize once when user logs in
    this.accountService.user$.pipe(
      takeUntil(this.destroy$),
      filter(user => !!user),
      take(1)
    ).subscribe(() => {
      this.init();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up all active subscriptions
    this.globalMessageSubscription?.unsubscribe();
    this.activeSubscriptions.forEach(sub => sub.unsubscribe());
    this.activeSubscriptions.clear();
  }

  private init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen for global transaction status messages (waiting, success, error for start/stop)
    this.globalMessageSubscription = this.websocketService.receive().pipe(
      takeUntil(this.destroy$),
      filter(msg => this.isGlobalStatusMessage(msg))
    ).subscribe(message => {
      this.handleStatusMessage(message);
    });
  }

  private isGlobalStatusMessage(msg: WsMessage): boolean {
    // These are global status messages for start/stop operations
    return msg.status === 'waiting' ||
           msg.status === 'success' ||
           (msg.status === 'error' && !msg.stage);
  }

  private handleStatusMessage(message: WsMessage): void {
    switch (message.status) {
      case 'waiting':
        if (message.stage === 'start' || message.stage === 'stop') {
          this.isWaiting = true;
        }
        break;
      case 'success':
        if (message.stage === 'start' || message.stage === 'stop') {
          this.isWaiting = false;
          this.isStarted = message.stage === 'start';
          if (this.isStarted) {
            this.transactionId.next(message.id!);
          } else {
            this.transactionId.next(-1);
          }
        }
        break;
      case 'error':
        this.isWaiting = false;
        if (message.info) {
          this.errorService.handle(message.info);
        }
        break;
    }
  }

  getTransaction(id: number): Observable<Transaction> {
    this.transactionId.next(id);
    return this.http.get<Transaction>(environment.apiUrl + environment.transactionInfo + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  /**
   * Get list of transactions with optional filters
   */
  getTransactionsList(filter: TransactionFilter): Observable<TransactionListItem[]> {
    let params = new HttpParams();

    if (filter.from) {
      params = params.set('from', this.formatDate(filter.from));
    }
    if (filter.to) {
      params = params.set('to', this.formatDateTimeEndOfDay(filter.to));
    }
    if (filter.username) {
      params = params.set('username', filter.username);
    }
    if (filter.id_tag) {
      params = params.set('id_tag', filter.id_tag);
    }
    if (filter.charge_point_id) {
      params = params.set('charge_point_id', filter.charge_point_id);
    }

    return this.http.get<TransactionListItem[]>(
      environment.apiUrl + environment.transactionsList,
      { params }
    ).pipe(
      catchError(this.errorHandler.bind(this))
    );
  }

  /**
   * Get single transaction details by ID
   */
  getTransactionDetails(transactionId: number): Observable<TransactionListItem> {
    return this.http.get<TransactionListItem>(
      environment.apiUrl + environment.transactionInfo + transactionId
    ).pipe(
      catchError(this.errorHandler.bind(this))
    );
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-CA').format(date);
  }

  private formatDateTimeEndOfDay(date: Date): string {
    const formattedDate = this.formatDate(date);
    return `${formattedDate}T23:59:59`;
  }

  getTransactions(): Observable<Transaction[]> {
    return this.transactions$;
  }

  /**
   * Start a transaction. Message is queued if not connected.
   */
  startTransaction(chargePointId: string, connectorId: number): void {
    this.websocketService.send({
      command: 'StartTransaction',
      charge_point_id: chargePointId,
      connector_id: connectorId
    });
  }

  /**
   * Stop a transaction. Message is queued if not connected.
   */
  stopTransaction(chargePointId: string, connectorId: number, transactionID: number): void {
    this.websocketService.send({
      command: 'StopTransaction',
      charge_point_id: chargePointId,
      connector_id: connectorId,
      transaction_id: transactionID
    });
  }

  /**
   * Subscribe to updates for a specific transaction.
   * Returns the subscription for manual cleanup if needed.
   * Safe to call multiple times for same transaction - uses reference counting.
   */
  subscribeOnUpdates(transactionID: number, chargePointID: string, connectorID: number): Subscription {
    const key = `${transactionID}:${chargePointID}:${connectorID}`;

    // Check if already subscribed
    const existing = this.activeSubscriptions.get(key);
    if (existing) {
      return existing;
    }

    const subscription = this.websocketService.subscribe({
      command: 'ListenTransaction',
      params: {
        transaction_id: transactionID,
        charge_point_id: chargePointID,
        connector_id: connectorID
      }
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.onWsMessage(message);
    });

    this.activeSubscriptions.set(key, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific transaction's updates.
   */
  unsubscribeFromUpdates(transactionID: number, chargePointID: string, connectorID: number): void {
    const key = `${transactionID}:${chargePointID}:${connectorID}`;

    const subscription = this.activeSubscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.activeSubscriptions.delete(key);
    }

    this.transactionId.next(-1);
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message);
    return throwError(() => err.message);
  }

  private onWsMessage(message: WsMessage): void {
    if (message.status === 'error') {
      if (message.info) {
        this.errorService.handle(message.info);
      }
      return;
    }

    if (message.status === 'value') {
      this.updateTransaction(message);
    }
  }

  private updateTransaction(message: WsMessage): void {
    const updated = message.id;
    const index = this.transactions.findIndex(transaction => transaction.transaction_id === updated);

    if (index !== -1 && updated) {
      const updatedTransaction: Transaction = this.transactions[index];
      updatedTransaction.meter_values.push(message.meter_value!);
      updatedTransaction.power_rate = message.power_rate!;
      updatedTransaction.consumed = message.power!;
      updatedTransaction.price = message.price!;
      updatedTransaction.status = message.connector_status!;
      updatedTransaction.battery = message.soc!;

      this.transactions[index] = updatedTransaction;
      this.transactions$.next(this.transactions);
    } else if (index === -1 && updated) {
      this.getTransaction(updated).pipe(
        takeUntil(this.destroy$)
      ).subscribe(transaction => {
        this.transactions.push(transaction);
        this.transactions$.next(this.transactions);
      });
    }
  }
}
