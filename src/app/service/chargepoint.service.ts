import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, Subject, Subscription, throwError } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Chargepoint } from '../models/chargepoint';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';
import { WebsocketService } from './websocket.service';
import { WsMessage } from '../models/ws-message';
import { AccountService } from './account.service';
import { CsCommand } from '../models/cs-command';
import { CsCommandResponse } from '../models/cs-command-response';

@Injectable({
  providedIn: 'root'
})
export class ChargepointService implements OnDestroy {
  private chargePoints: Chargepoint[] = [];
  private chargePoints$ = new BehaviorSubject<Chargepoint[]>([]);

  private destroy$ = new Subject<void>();
  private wsSubscription: Subscription | null = null;
  private isSubscribed = false;
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
    this.unsubscribeFromUpdates();
  }

  private init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.getAll().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      if (result) {
        this.chargePoints = result;
        this.chargePoints$.next(this.chargePoints);
      }
    });
  }

  /**
   * Subscribe to charge point updates via WebSocket.
   * Safe to call multiple times - uses reference counting internally.
   */
  subscribeOnUpdates(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    this.wsSubscription = this.websocketService.subscribe({
      command: 'ListenChargePoints'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.onWsMessage(message);
    });
  }

  /**
   * Unsubscribe from charge point updates.
   */
  unsubscribeFromUpdates(): void {
    if (!this.isSubscribed) return;
    this.isSubscribed = false;

    this.wsSubscription?.unsubscribe();
    this.wsSubscription = null;
  }

  getChargePoints(): Observable<Chargepoint[]> {
    return this.chargePoints$;
  }

  getChargePoint(id: string): Observable<Chargepoint> {
    return this.http.get<Chargepoint>(environment.apiUrl + environment.chargePoint + id)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  postChargePoint(chargePoint: Chargepoint): Observable<Chargepoint> {
    return this.http.post<Chargepoint>(environment.apiUrl + environment.chargePoint + chargePoint.charge_point_id, chargePoint)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  currentChargePoints(): Chargepoint[] {
    return this.chargePoints;
  }

  private getAll(): Observable<Chargepoint[]> {
    return this.http.get<Chargepoint[]>(environment.apiUrl + environment.chargePointList)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getRecentChargePoints(): Observable<Chargepoint[]> {
    return this.http.get<Chargepoint[]>(environment.apiUrl + environment.recentChargePoints)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }

  getAllChargePoints(): Observable<Chargepoint[]> {
    return this.getAll();
  }

  private onWsMessage(message: WsMessage): void {
    if (message.status === 'error') {
      if (message.info) {
        this.errorService.handle(message.info);
      }
      return;
    }
    if (message.status === 'event' && message.stage === 'charge-point-event') {
      if (message.data) {
        const updated = message.data;
        const index = this.chargePoints.findIndex(chp => chp.charge_point_id === updated);
        if (environment.debug) {
          console.log('Charge point update', message);
        }
        if (index !== -1) {
          this.getChargePoint(updated).pipe(
            takeUntil(this.destroy$)
          ).subscribe(chargePoint => {
            this.chargePoints[index] = chargePoint;
            this.chargePoints$.next(this.chargePoints);
          });
        }
      }
    }
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message);
    return throwError(() => err.message);
  }

  onStop(): void {
    this.unsubscribeFromUpdates();
  }

  sendCsCommand(chargePointId: string, connectorId: number, command: string, payload: string): Observable<CsCommandResponse> {
    const csCommand: CsCommand = {
      charge_point_id: chargePointId,
      connector_id: connectorId,
      feature_name: command,
      payload: payload,
    };

    return this.http.post<CsCommandResponse>(environment.apiUrl + environment.sendCommand, csCommand)
      .pipe(
        catchError(this.errorHandler.bind(this))
      );
  }
}
