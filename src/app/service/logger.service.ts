import { Injectable, OnDestroy } from '@angular/core';
import { Message } from '../models/message';
import { BehaviorSubject, catchError, Observable, Subject, Subscription, throwError } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from './error.service';
import { environment } from '../../environments/environment';
import { WebsocketService } from './websocket.service';
import { AccountService } from './account.service';
import { WsConnectionState } from '../models/ws-connection-state';

@Injectable({
  providedIn: 'root'
})
export class LoggerService implements OnDestroy {
  private messages: Message[] = [];
  private messages$ = new Subject<Message[]>();

  private isOnline = new BehaviorSubject(false);
  isOnline$ = this.isOnline.asObservable();

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
    // Track connection state
    this.websocketService.connectionState$.pipe(
      takeUntil(this.destroy$),
      map(state => state === WsConnectionState.CONNECTED)
    ).subscribe(connected => {
      this.isOnline.next(connected);
    });

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
    this.unsubscribeFromWs();
  }

  /**
   * Subscribe to log updates via WebSocket.
   * Safe to call multiple times - prevents duplicate subscriptions.
   */
  subscribeOnUpdates(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    this.wsSubscription = this.websocketService.subscribe({
      command: 'ListenLog'
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.onWsMessage(message);
    });
  }

  private unsubscribeFromWs(): void {
    if (!this.isSubscribed) return;
    this.isSubscribed = false;

    this.wsSubscription?.unsubscribe();
    this.wsSubscription = null;
  }

  private init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    this.loadFromApi().pipe(
      takeUntil(this.destroy$)
    ).subscribe(messages => {
      this.messages = messages;
      this.messages$.next(this.messages);
    });
  }

  private onWsMessage(message: any): void {
    if (message.status === 'error') {
      if (message.info) {
        this.errorService.handle(message.info);
      }
      return;
    }
    if (message.status === 'event' && message.stage === 'log-event') {
      if (message.data) {
        const newMessage: Message = JSON.parse(message.data);
        this.messages.unshift(newMessage);
        this.messages$.next(this.messages);
      }
    }
  }

  private loadFromApi(): Observable<Message[]> {
    const url = environment.apiUrl + environment.readSysLog;
    return this.http.get<Message[]>(url)
      .pipe(catchError(this.errorHandler.bind(this)));
  }

  getMessages(): Observable<Message[]> {
    return this.messages$;
  }

  currentMessages(): Message[] {
    return this.messages;
  }

  private errorHandler(err: HttpErrorResponse) {
    this.errorService.handle(err.message);
    return throwError(() => err.message);
  }

  onStop(): void {
    this.unsubscribeFromWs();
  }
}
