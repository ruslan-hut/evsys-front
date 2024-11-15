import { Injectable, OnDestroy } from '@angular/core';
import {BehaviorSubject, Observable, Subscription, timer, throwError, retry} from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from "../../environments/environment";
import { WsMessage } from "../models/ws-message";
import { AccountService } from "./account.service";
import { WsRequest } from "../models/ws-request";
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  private socket$: WebSocketSubject<any>;
  private messages$: Observable<WsMessage>;
  private pingInterval$: Observable<number> = timer(10000, 30000); // Ping every 30 seconds
  private pingSubscription: Subscription;

  private connectionCount = 0;
  private isConnected = new BehaviorSubject<boolean>(false);
  isConnected$ = this.isConnected.asObservable();
  token: string | null = null;

  constructor(
    private accountService: AccountService
  ) {
    this.accountService.user$.subscribe(user => {
      if (user && user.token && user.token !== this.token) {
        this.token = user.token;
        this.connect();
      }
    });
  }

  ngOnDestroy() {
    this.stopPing();
    this.close();
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
    }
  }

  private connect(): void {
    this.socket$ = webSocket({
      url: environment.wsUrl,
      openObserver: {
        next: () => {
          this.connectionCount++;
          if (environment.debug) {
            console.log('WS: connection opened', this.connectionCount);
          }
          this.isConnected.next(true);
          this.startPing();
        }
      },
      closeObserver: {
        next: () => {
          if (environment.debug) {
            console.log('WS: connection closed');
          }
          this.isConnected.next(false);
          this.stopPing();
        }
      }
    });

    this.messages$ = this.socket$.pipe(
      catchError(err => {
        if (environment.debug) {
          console.log('WS: connection error', err);
        }
        return throwError(() => new Error('WS: connection error'));
      }),
      retry({delay: 5000}),
    );

    this.socket$.subscribe({
      next: message => {
        if (environment.debug) {
          console.log('WS << ', message);
        }
      },
      error: err => {
        if (environment.debug) {
          console.log('WS: message reading error', err);
        }
      }
    });
  }

  private startPing(): void {
    this.pingSubscription = this.pingInterval$.subscribe(() => {
      const pingMessage: WsRequest = { command: 'PingConnection' };
      this.send(pingMessage);
    });
  }

  private stopPing(): void {
    if (this.pingSubscription) {
      this.pingSubscription.unsubscribe();
    }
  }

  send(message: WsRequest): void {
    if (!this.socket$) {
      if (environment.debug) {
        console.log('WS: send aborted - not connected');
      }
      return;
    }
    if (environment.debug) {
      console.log('WS >> ', message.command, message.charge_point_id, message.connector_id, message.transaction_id);
    }
    if (this.token) {
      message.token = this.token;
    }
    this.socket$.next(message);
  }

  receive(): Observable<WsMessage> {
    return this.messages$;
  }

  close(): void {
    if (this.socket$) {
      this.socket$.complete();
    }
  }
}
