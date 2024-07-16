import { Injectable, OnDestroy } from '@angular/core';
import {BehaviorSubject, Observable, Subscription, timer, throwError, timeout} from "rxjs";
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from "../../environments/environment";
import { WsMessage } from "../models/ws-message";
import { ErrorService } from "./error.service";
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

  private isConnected = new BehaviorSubject<boolean>(false);
  isConnected$ = this.isConnected.asObservable();

  token: string | null = null;

  private reconnectionAttempts = 0;
  private readonly maxReconnectionAttempts = 20; // Set max attempts to prevent infinite retrying
  private reconnectionInterval = 1000; // Start with 1 second

  constructor(
    private errorService: ErrorService,
    private accountService: AccountService
  ) {
    this.accountService.token$.subscribe(token => {
      if (token && token !== this.token) {
        this.token = token;
        this.connect();
      }
    });
    this.startPing();
  }

  ngOnDestroy() {
    this.stopPing();
    this.close();
  }

  private connect(): void {
    this.socket$ = webSocket({
      url: environment.wsUrl,
      openObserver: {
        next: () => {
          if (environment.debug) {
            console.log('WebSocket connection opened');
          }
          this.isConnected.next(true);
          this.reconnectionAttempts = 0; // Reset on successful connection
        }
      },
      closeObserver: {
        next: () => {
          if (environment.debug) {
            console.log('WebSocket connection closed');
          }
          this.isConnected.next(false);
          this.reconnect();
        }
      }
    });

    this.messages$ = this.socket$.pipe(
      timeout(60000), // 60 seconds to receive a message/ping response
      catchError(err => {
        if (err.name === 'TimeoutError') {
          this.reconnect();
        }
        return throwError(() => new Error('connection error'));
      })
    );

    this.messages$.subscribe(message => {
      if (environment.debug) {
        console.log('<<--- ', message);
      }
      else {
        console.log('-- ', message.status, ":", message.info);
      }
    });
  }

  private reconnect(): void {
    if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
      setTimeout(() => {
        this.errorService.handle(`Attempting to reconnect (${this.reconnectionAttempts + 1}/${this.maxReconnectionAttempts})...`);
        this.reconnectionAttempts++;
        this.connect();
      }, this.reconnectionInterval * this.reconnectionAttempts);

      this.reconnectionInterval = Math.min(this.reconnectionInterval * 2, 30000);
    } else if (environment.debug) {
      console.log('Max reconnection attempts reached. Giving up.');
    }
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
        console.log('Send: websocket not connected');
      }
      return;
    }
    if (environment.debug) {
      console.log('--->> ', message.command);
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
